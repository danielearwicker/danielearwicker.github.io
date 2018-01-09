import * as showdown from "showdown";
import * as xml2js from "xml2js";
import * as fs from "fs";
import * as path from "path";

const inputPath = "pages";
const templatePath = "templates";
const outputPath = ".";

function process(
    text: string,
    prefix: string,
    suffix: string,
    callback: (text: string) => string,
    callbackPlain?: (text: string) => string) {

    const output: string[] = [];
    let pos = 0;

    const plain = (text: string) => {
        if (callbackPlain) {
            text = callbackPlain(text);
        }
        output.push(text);
    }

    for (;;) {
        let start = text.indexOf(prefix, pos);
        if (start === -1) {
            plain(text.substr(pos));
            break;
        }

        const endOfPlain = start;
        start += prefix.length;

        const end = text.indexOf(suffix, start);
        if (end === -1) {
            plain(text.substr(pos));
            break;
        }

        plain(text.substring(pos, endOfPlain));
        output.push(callback(text.substring(start, end)));

        pos = end + suffix.length;
    }

    return output.join("");
}

interface StringMap {
    [name: string]: string | undefined
};

function getHeaders(text: string) {
    const lines = text.split("\n"), result: StringMap = {};
    let end = 0;

    for (; end < lines.length; end++) {
        const line = lines[end].trim(), eq = line.indexOf(":");
        if (!line || eq === -1) {
            break;
        }
        result[line.substr(0, eq)] = line.substr(eq + 1);
    }

    result["rest"] = lines.slice(end).join("\n");
    return result;
}

const cachedTemplates: StringMap = {};

function template(name: string, params: StringMap) {

    const template = cachedTemplates[name] ||
        (cachedTemplates[name] = fs.readFileSync(path.join(templatePath, name + ".html"), "utf8"));

    return process(template, "${", "}", param => params[param] || "");
}

function makeTitle(name: string) {
    const lastDot = name.lastIndexOf(".");
    if (lastDot !== -1) {
        var ext = name.substr(lastDot + 1).toLowerCase();
        if (ext === "md") {
            return name.substr(0, lastDot);
        }
    }
    return name;
}

function makeHtmlName(title: string) {
    return title.replace(/[^a-z0-9_]+/gi, "_")
                .replace(/^_+/, "")
                .replace(/_+$/, "") + ".html";
}

function convertLink(link: string) {
    const bar = link.indexOf("|");
    if (bar == -1) {
        return "[" + link + "](" + makeHtmlName(link) + ")";
    }
    const label = link.substr(0, bar), target = link.substr(bar + 1);

    return "[" + label + "](" + makeHtmlName(target) + ")";
}

function getSnippet(text: string) {
    var lines = text.split("\n");
    var end = 0, blankCount = 0;    
    for (; end < lines.length; end++) {
        var line = lines[end].trim();
        if (line.indexOf("```") === 0) {
            break;
        }
        if (!line) {
            blankCount++;
        }
        if (blankCount === 4) {
            break;
        }
    }
    return lines.slice(0, end).join("\n");
}

interface Article extends StringMap {
    title: string;          // usually the source file name with .md removed
    tags: string;           // plain text tag names, space separated
    formattedTags: string;  // comma-separated links to tag pages
    date: string;           // e.g. 2016-05-01
    body: string;           // just the HTML text (no header)
    link: string;           // HTML filename
    content?: string;       // header + body
    snippet?: string;
}

const codeTicks = "```";

function formatTags(tags: string[]) {
    return tags.map(t => `<a href="tag-${t}.html">${t.toUpperCase()}</a>`).join(" ");
}

function formatCountedTags(tags: string[]) {
    return tags.map(t => `<a href="tag-${t}.html">${t.toUpperCase()} (${articlesByTag[t].length})</a>`).join(" ");
}

const articles = fs.readdirSync(inputPath).map(name => {

    const text = fs.readFileSync(path.join(inputPath, name), "utf8");
    const headers = getHeaders(text);
    const date = headers["date"];
    const tags = headers["tags"] || "";
    const title = headers["title"] || makeTitle(name);

    if (!date) {
        throw new Error(`Article has no date header: ${name}`);
    }

    const linked = process(headers["rest"] || "", "[[", "]]", convertLink);

    const getBody = (source: string) =>
        process(source, codeTicks, codeTicks, code => {

            var newLine = code.indexOf('\n');
            if (newLine === -1) {
                return code;
            }

            var lang = code.substr(0, newLine).replace(/\s/g, "");
            var rest = code.substr(newLine + 1);
            return "<pre><code class=\"" + lang + "\">" +
                rest.replace(/</g, "&lt;").replace(/>/g, "&gt;") + "</code></pre>";

        }, plain => new showdown.Converter().makeHtml(plain));

    const body = getBody(linked);

    var formattedTags = formatTags(splitTags(tags));

    const article: Article = { title, tags, date, body, formattedTags, link: makeHtmlName(title) };

    article.content = template("article", article);
    article.snippet = getBody(getSnippet(linked));

    return article;
});

articles.sort((a, b) => b.date.localeCompare(a.date));

function articleList(list: Article[], current?: Article) {
    return list.map(article => template(article === current ? "selected" : "recent", article)).join("");
}

for (const name of fs.readdirSync(outputPath)) {
    if (path.extname(name) === ".html") {
        fs.unlinkSync(path.join(outputPath, name));
    }
}

function splitTags(tags: string) {
    return tags.trim().split(" ").map(t => t.toLowerCase());
}

const articlesByTag: { [name: string]: Article[] } = {};

for (const article of articles) {
    for (const tag of splitTags(article.tags)) {
        const articlesForTag = articlesByTag[tag] || (articlesByTag[tag] = []);
        articlesForTag.push(article);
    }
}

const topics = formatCountedTags(Object.keys(articlesByTag).sort());

for (const article of articles) {
    fs.writeFileSync(
        path.join(outputPath, makeHtmlName(article.title)),
        template("shell", {
            recent: articleList(articles, article),
            content: article.content,
            title: article.title,
            topics
        }));
}

for (const tag of Object.keys(articlesByTag)) {
    fs.writeFileSync(
        path.join(outputPath, `tag-${tag}.html`),
        template("shell", {
            recent: articleList(articles),
            content: articlesByTag[tag].map(article => template("snippet", article)).join("\n"),
            title: tag,
            topics
        }));
}

fs.writeFileSync(
    path.join(outputPath, makeHtmlName("index")),
    template("shell", {
        recent: articleList(articles),
        content: articles.map(article => template("snippet", article)).join("\n"),
        title: "earwiki",
        topics
    }));

interface RssNode {
    title: string;
    link: string;
    description: string;
}

interface RssItem extends RssNode {
    pubDate: string;
}

interface RssChannel extends RssNode {
    lastBuildDate: string;
    item: RssItem[];
}

interface RssRoot {
    rss: {
        $: { "version": "2.0" };
        channel: RssChannel;
    }
}

export function rss(baseUrl: string, history: Article[]) {
    let items: RssItem[] = history.map(h => ({
        title: h.title,
        pubDate: h.date + "T00:00:00Z",
        description: h.snippet || "",
        link: baseUrl + h.link
    }));

    items.sort((a, b) => b.pubDate.localeCompare(a.pubDate));
    items = items.slice(0, 50);

    const rssJson: RssRoot = {
        rss: {
            $: { "version": "2.0" },
            channel: {
                title: "Ear/Wiki",
                link: baseUrl,
                description: "No profit grows where is no pleasure taken",
                lastBuildDate: items[0].pubDate,
                item: items
            }
        }
    };

    return new xml2js.Builder().buildObject(rssJson);
}

fs.writeFileSync(
    path.join(outputPath, "rss.xml"),
    rss("http://danielearwicker.github.io/", articles));
