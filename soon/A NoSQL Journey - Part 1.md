tags: architecture
date: 2019-12-10

Last time I [complained about SQL at some length](Two_Cheers_for_SQL.html). Now I want to be more constructive, and figure out a different way of storing and retrieving data. For fun, I'm going to re-invent lots of wheels, based on limited knowledge and blind guesswork, and see how far I get. I should learn something, at least, right?

## The Problem

The right choice of technology is very much dependent on the problem you're trying to solve. The problem I have is sifting through lots of records looking for patterns. I'm particularly interested in finding pairs or groups of things that are similar in some way. This is hard work because you have to compare each thing with every other thing. It's the same as if you have to draw lines connecting a set of dots with each other. Dealing with one dot involves drawing `N - 1` lines. If you repeat this for all dots, you've now drawn `N * (N - 1)` lines. But also now you have *two* lines between every pair of dots, so throw away half of them, and you only need `N * (N - 1) / 2` lines to be exact. But in big O terms, it's about as bad as `O(N^2)` anyway.

To get around this a good starting point is to first group records by some value that can be computed from their attributes, on the assumption that you can get away with only looking for exact matches between records in the same group. If a group has five members, that's only 10 pairs. If you're lucky, the groups might all be this small! The technical term for this is [blocking](https://link.springer.com/chapter/10.1007/978-3-319-11257-2_20).

This whole problem is very much the traditional domain of [Hadoop](https://hadoop.apache.org/) and its menagerie of related projects. But one wrinkle is that I want to process an initial large dataset, and then make incremental updates to it each day, producing derived datasets from it. The initial input may be ~10^8 records (covering a 3 year period), then the daily update will average around ~10^5 records. The updates may be new records or updates to previously analysed ones. Any new record may count as "similar" to any of the existing records. This pattern may be repeated for thousands of customers, whose data is analysed (completely independently) every day. So maybe 10^8 records ingested per day just for the daily updates across all customers.

Could we just forget the update problem? Instead, just append each day's update to an ever-growing input file, and reprocess it from scratch every day. Given the amount of work involved and the number of customers, I think not. We have to pay for the processing power required, so incremental updates (given that they involve a fraction of one percent of existing records) ought to be a huge win. So we need *some* kind of indexed database thing.

## First Idea: SQL

How useful would a super-traditional RDBMS be here? My blocking function might be to take the `city` and `creation_date` of a record, because I'm theorising that matches will only occur between records from the same city and on the same day, and that those will be fairly small groups of records. So:

```sql
select a.id, b.id
from things AS a
join things AS b ON a.city = b.city AND
                    a.creation_date = b.creation_date AND
                    a.id > b.id
```

That finds all pairs, and doesn't include things matching with themselves, and also only finds each pair once, thanks to the `id` comparison. Neat! But (as we noted above) we want a kind of circuit breaker on the size of the groups. Let's go with 5, so we'll ignore any group that produces more than 5 pairs. This is not necessarily unrealistic or a cheat; if we're looking for unusual things, it makes sense to discard groups that are too frequent to be of interest.

So, another idea: we first identify the distinct combinations of city and date that represent every group, and we also apply our size limit:

```sql
select city, creation_date
from things
group by city, creation_date
having count(*) > 2 and count(*) < 6
```

Furthermore, if I create an index on those two columns, the query planner looks much happier. All it has to do is scan that index, because it is ordered by the two columns we want to group by. Therefore the mutual group members are right next to each other, making it easy to find every group and their member counts, and skip any that are two big or small. Indexes are great! But they have to be maintained at ingestion time. Also this doesn't really finish the job; I now need to generate the pairs in each group, which means more scanning.

So we can get SQL to maintain some indexes that avoid the need to repeat large-scale sorting and grouping activities every time we want to update our picture, but it is very hard to stop it doing some of the work on the fly.

Also if you use a cloud-managed SQL service, the rate at which you can insert records varies depending on price. Using Azure SQL Server, you can drag a slider to choose how much you want to spend. If I set it to about £110 a month (consuming all my MSDN subscription allowance), I can do 4000 inserts per second into a realistic table with one index. If I add more indexes like the ones used in the above examples, the rate is halved. Also this a small test (100,000 records) into an initially blank table; if each customer starts with 100 million records and adds another 100,000 a day, the insert rate is going to start quite a bit lower and get worse as time passes. Could be in the region hundreds per second, when I need it to be many thousands. Even then, my database would be running flat out all day just to do the ingesting, and would never be available for querying, so that's not realistic. I really need it to ingest all the data and perform all the queries on it to find patterns in a couple of hours overnight, so they're ready for the users to examine each day. So realistically I'm going to be spending an amount equivalent to the salaries of a few humans to be able to deal with the load. It seems sensible to see if we can find a cheaper way. This is why the ability to write code is valuable!

## The Happy Computing Miser

The core of what we're doing here is sorting and scanning. If we can define our own operations to perform on the sorted groups, we can also incrementally update them. This doesn't sound like rocket science.

What's the cheapest form of storage in cloud platforms? It's blob storage. As a raw storage medium with no fancy structural indexing, it's very fast. On Azure, if you allow 1 KB per record, it should theoretically be possible to store 3 million records per second. That's not realistic, of course, because we want to sort and update and so on. But it's a tantalising thought. And it has the property of virtually unlimited elastic scaling.

Of course we also need cores to run our code. What's the most elemental computing resource? A docker container, which we can dynamically start and stop and (crucially for me, counting my pennies) only be billed for the seconds of time they were running. The dream of the computing miser is to be able to use the servers of the cloud platform like a pool of worker threads, sometimes temporarily scaling out to thousands of concurrent operations and then scaling back down as required. It's not quite as slick as I've made it sound, because a server has to be allocated and the docker image has to be pulled, so it can take 30 seconds or so for a new worker to start. But here we're talking about the idea of starting 50 workers to do an hour's work, in parallel. The start-up overhead is parallel, so we get an excitingly close approximation to the dream of a dynamically scalable and virtually limitless pool of workers.

But how does one go about maintaining sorted datasets layered over a storage system that can only store dumb chunks of data? If you just treat each blob as a sorted list, it's difficult to insert because you have to rewrite the blob from the insertion point onward, effectively moving the subsequent data along to make room.

But if you divide the whole dataset into several good-sized buckets, each bucket containing only records with a distinct *range* of keys, then the records don't need to be sorted *within* each bucket. You only have to append a new record to the correct bucket according to its key. This is not quite sorting; it's merely partitioning. It makes insertion nice and fast, assuming you can find the right bucket. Sorting within a bucket can be done very quickly in memory at whatever time is appropriate depending on the usage pattern (if only a small subset of buckets will ever be read, don't waste time sorting their contents before you save them; just sort them after you read them).

If a bucket gets too large, you can split it into two buckets, each getting half of the contents. Of course at this point you need to sort them into upper and lower halves, to maintain the proper partitioning of the buckets so they cover non-overlapping ranges. *Yes, I'm re-inventing the B-Tree*, where these buckets are the leaf nodes or *pages*.

When a page is updated, we can give it a new ID so it will be saved in a new blob. That is, the whole B-tree is a non-destructive or [persistent data structure](https://en.wikipedia.org/wiki/Persistent_data_structure), in the FP sense. This gives us the option to retain all previous versions of the data structure as it changes, if we want to (blob storage is cheap!) We can record the IDs of old blobs as they become garbage, and clean them up when we no longer need those versions.

This can provide a really lightweight form of concurrency support. While an updated version is being prepared, it can be persisted to a new set of blobs, without affecting the current versions. Readers are unaffected. Only when all other nodes besides the root have been successfully flushed to storage is the root node finally updated, and so new readers see the new state, and all readers always see *some* recent consistent state.

Why might this be interesting, given the existence of plentiful B-Tree implementations found in real existing database products? Mainly because of what it won't do. There will be no locking, and no high-level query language, so no query planner. It will only do what it is *directly* asked to do, which will consist of throwing records into blob storage as fast as possible such that they are partitioned (effectively sorted) by their keys.

It should be thought of more like an ordered mapping of keys to values, providing fast look up of an individual value by its key and also fast sequential scanning starting from a specified key. But it also persists its contents to blob storage in a non-destructively updating way.

## The Dream

- A simple implementation of a B-Tree, layered over cheap commodity blob storage in the cloud, provided as a very easy-to-use data structure.
- Use simple LRU caching of the nodes, which can flush them out to storage as the data set becomes too big to fit in memory.
- Support non-destructive updating.
- Write processing code that maintains indexed data in these B-Trees, so that they can be incrementally updated as new data arrives.
- Structure keys so there is a logical, app-level prefix, which need not be unique, and a physical, system-level suffix that makes the whole key unique. The first part I'll call the "group key". So we can form groups of records with the same group key (and all the members of a group will be adjacent in the B-Tree), but we can also target a specific record by its full key.
- Structure the pipeline as a chain of *derived* datasets. Each stage declares how it consumes groups of input records and emits output records, so we can declaratively group and re-group records in phases as required.
- Retain tracking information to allow derived data to be efficiently updated, like materialised views.
