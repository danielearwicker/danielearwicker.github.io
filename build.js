"use strict";
var showdown = require("showdown");
var xml2js = require("xml2js");
var fs = require("fs");
var path = require("path");
var inputPath = "pages";
var templatePath = "templates";
var outputPath = ".";
function process(text, prefix, suffix, callback, callbackPlain) {
    var output = [];
    var pos = 0;
    var plain = function (text) {
        if (callbackPlain) {
            text = callbackPlain(text);
        }
        output.push(text);
    };
    for (;;) {
        var start = text.indexOf(prefix, pos);
        if (start === -1) {
            plain(text.substr(pos));
            break;
        }
        var endOfPlain = start;
        start += prefix.length;
        var end = text.indexOf(suffix, start);
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
;
function getHeaders(text) {
    var lines = text.split("\n"), result = {};
    var end = 0;
    for (; end < lines.length; end++) {
        var line = lines[end].trim(), eq = line.indexOf(":");
        if (!line || eq === -1) {
            break;
        }
        result[line.substr(0, eq)] = line.substr(eq + 1);
    }
    result["rest"] = lines.slice(end).join("\n");
    return result;
}
var cachedTemplates = {};
function template(name, params) {
    var template = cachedTemplates[name] ||
        (cachedTemplates[name] = fs.readFileSync(path.join(templatePath, name + ".html"), "utf8"));
    return process(template, "${", "}", function (param) { return params[param] || ""; });
}
function makeTitle(name) {
    var lastDot = name.lastIndexOf(".");
    if (lastDot !== -1) {
        var ext = name.substr(lastDot + 1).toLowerCase();
        if (ext === "md") {
            return name.substr(0, lastDot);
        }
    }
    return name;
}
function makeHtmlName(title) {
    return title.replace(/[^a-z0-9_]+/gi, "_") + ".html";
}
function convertLink(link) {
    var bar = link.indexOf("|");
    if (bar == -1) {
        return "[" + link + "](" + makeHtmlName(link) + ")";
    }
    var label = link.substr(0, bar), target = link.substr(bar + 1);
    return "[" + label + "](" + makeHtmlName(target) + ")";
}
function getSnippet(text) {
    var lines = text.split("\n");
    var end = 0, blankCount = 0;
    for (; end < lines.length; end++) {
        var line = lines[end].trim();
        if (line.indexOf("<pre><code") !== -1) {
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
var codeTicks = "```";
function formatTags(tags) {
    return tags.map(function (t) { return "<a href=\"tag-" + t + ".html\">" + t.toUpperCase() + "</a>"; }).join(" ");
}
function formatCountedTags(tags) {
    return tags.map(function (t) { return "<a href=\"tag-" + t + ".html\">" + t.toUpperCase() + " (" + articlesByTag[t].length + ")</a>"; }).join(" ");
}
var articles = fs.readdirSync(inputPath).map(function (name) {
    var text = fs.readFileSync(path.join(inputPath, name), "utf8");
    var headers = getHeaders(text);
    var date = headers["date"];
    var tags = headers["tags"] || "";
    var title = headers["title"] || makeTitle(name);
    if (!date) {
        throw new Error("Article has no date header: " + name);
    }
    var linked = process(headers["rest"] || "", "[[", "]]", convertLink);
    var getBody = function (source) {
        return process(source, codeTicks, codeTicks, function (code) {
            var newLine = code.indexOf('\n');
            if (newLine === -1) {
                return code;
            }
            var lang = code.substr(0, newLine).replace(/\s/g, "");
            var rest = code.substr(newLine + 1);
            return "<pre><code class=\"" + lang + "\">" +
                rest.replace(/</g, "&lt;").replace(/>/g, "&gt;") + "</code></pre>";
        }, function (plain) { return new showdown.Converter().makeHtml(plain); });
    };
    var body = getBody(linked);
    var formattedTags = formatTags(tags.trim().split(" "));
    var article = { title: title, tags: tags, date: date, body: body, formattedTags: formattedTags, link: makeHtmlName(title) };
    article.content = template("article", article);
    article.snippet = getBody(getSnippet(linked));
    return article;
});
articles.sort(function (a, b) { return b.date.localeCompare(a.date); });
function articleList(list, current) {
    return list.map(function (article) { return template(article === current ? "selected" : "recent", article); }).join("");
}
for (var _i = 0, _a = fs.readdirSync(outputPath); _i < _a.length; _i++) {
    var name_1 = _a[_i];
    if (path.extname(name_1) === ".html") {
        fs.unlink(path.join(outputPath, name_1));
    }
}
var articlesByTag = {};
for (var _b = 0, articles_1 = articles; _b < articles_1.length; _b++) {
    var article = articles_1[_b];
    for (var _c = 0, _d = article.tags.trim().split(" ").map(function (t) { return t.toLowerCase(); }); _c < _d.length; _c++) {
        var tag = _d[_c];
        var articlesForTag = articlesByTag[tag] || (articlesByTag[tag] = []);
        articlesForTag.push(article);
    }
}
var topics = formatCountedTags(Object.keys(articlesByTag).sort());
for (var _e = 0, articles_2 = articles; _e < articles_2.length; _e++) {
    var article = articles_2[_e];
    fs.writeFileSync(path.join(outputPath, makeHtmlName(article.title)), template("shell", {
        recent: articleList(articles, article),
        content: article.content,
        title: article.title,
        topics: topics
    }));
}
for (var _f = 0, _g = Object.keys(articlesByTag); _f < _g.length; _f++) {
    var tag = _g[_f];
    fs.writeFileSync(path.join(outputPath, "tag-" + tag + ".html"), template("shell", {
        recent: articleList(articles),
        content: articlesByTag[tag].map(function (article) { return template("snippet", article); }).join("\n"),
        title: tag,
        topics: topics
    }));
}
fs.writeFileSync(path.join(outputPath, makeHtmlName("index")), template("shell", {
    recent: articleList(articles),
    content: articles.map(function (article) { return template("snippet", article); }).join("\n"),
    title: "earwiki",
    topics: topics
}));
function rss(baseUrl, history) {
    var items = history.map(function (h) { return ({
        title: h.title,
        pubDate: h.date + "T00:00:00Z",
        description: h.snippet || "",
        link: baseUrl + h.link
    }); });
    items.sort(function (a, b) { return b.pubDate.localeCompare(a.pubDate); });
    items = items.slice(0, 50);
    var rssJson = {
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
exports.rss = rss;
fs.writeFileSync(path.join(outputPath, "rss.xml"), rss("http://danielearwicker.github.io/", articles));
