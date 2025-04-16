// get the ninja-keys element
const ninja = document.querySelector('ninja-keys');

// add the home and posts menu items
ninja.data = [{
    id: "nav-about",
    title: "about",
    section: "Navigation",
    handler: () => {
      window.location.href = "/";
    },
  },{id: "nav-blog",
          title: "blog",
          description: "",
          section: "Navigation",
          handler: () => {
            window.location.href = "/blog/";
          },
        },{id: "nav-repositories",
          title: "repositories",
          description: "No profit grows where is no pleasure taken",
          section: "Navigation",
          handler: () => {
            window.location.href = "/repositories/";
          },
        },{id: "post-poorly-structured-notes-on-ai-part-3",
        
          title: "Poorly Structured Notes on AI Part 3",
        
        description: "",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2025/ai3/";
          
        },
      },{id: "post-poorly-structured-notes-on-ai-part-2",
        
          title: "Poorly Structured Notes on AI Part 2",
        
        description: "",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2025/ai2/";
          
        },
      },{id: "post-poorly-structured-notes-on-ai-part-1",
        
          title: "Poorly Structured Notes on AI Part 1",
        
        description: "",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2025/ai1/";
          
        },
      },{id: "post-how-to-become-a-prompt-engineer",
        
          title: "How to become a prompt engineer",
        
        description: "",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2024/Prompt-Engineer/";
          
        },
      },{id: "post-time-reversible-events",
        
          title: "Time reversible events",
        
        description: "",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2023/Time-reversible-events/";
          
        },
      },{id: "post-language-smackdown-java-vs-c",
        
          title: "Language Smackdown: Java vs. C#",
        
        description: "",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2023/Java-Csharp/";
          
        },
      },{id: "post-domesday-39-86-reloaded-reloaded",
        
          title: "Domesday &#39;86 Reloaded (Reloaded)",
        
        description: "",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2021/Domesday/";
          
        },
      },{id: "post-the-blob-lottery",
        
          title: "The Blob Lottery",
        
        description: "",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2020/The-Blob-Lottery/";
          
        },
      },{id: "post-abstraction-is-a-thing",
        
          title: "Abstraction is a Thing",
        
        description: "",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2020/Abstraction-is-a-Thing/";
          
        },
      },{id: "post-unfortunate-bifurcations",
        
          title: "Unfortunate Bifurcations",
        
        description: "",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2019/Unfortunate-Bifurcations/";
          
        },
      },{id: "post-two-cheers-for-sql",
        
          title: "Two Cheers for SQL",
        
        description: "",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2019/SQL/";
          
        },
      },{id: "post-factory-injection-in-c",
        
          title: "Factory Injection in C#",
        
        description: "",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2019/Factory-Injection/";
          
        },
      },{id: "post-hangfire-a-tale-of-several-queues",
        
          title: "Hangfire - A Tale of Several Queues",
        
        description: "",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2019/Hangfire/";
          
        },
      },{id: "post-how-does-auth-work",
        
          title: "How Does Auth work?",
        
        description: "",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2018/Auth/";
          
        },
      },{id: "post-from-ember-to-react-part-2-baby-bathwater-routing-etc",
        
          title: "From Ember to React, Part 2: Baby, Bathwater, Routing, etc.",
        
        description: "",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2018/Ember-React-2/";
          
        },
      },{id: "post-from-ember-to-react-part-1-why-not-ember",
        
          title: "From Ember to React, Part 1: Why Not Ember?",
        
        description: "",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2017/Ember-React-1/";
          
        },
      },{id: "post-json-mobx-like-react-but-for-data-part-2",
        
          title: "json-mobx - Like React, but for Data (Part 2)",
        
        description: "",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2017/json-mobx/";
          
        },
      },{id: "post-redux-in-pieces",
        
          title: "Redux in Pieces",
        
        description: "",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2017/Redux-in-Pieces/";
          
        },
      },{id: "post-box-39-em-property-references-for-typescript-md",
        
          title: "Box &#39;em! - Property references for TypeScript.md",
        
        description: "",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2017/Boxm/";
          
        },
      },{id: "post-typescript-what-39-s-up-with-this",
        
          title: "TypeScript - What&#39;s up with this?",
        
        description: "",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2017/TypeScript-This/";
          
        },
      },{id: "post-2016-12-28-mobx-like-react-but-for-data",
        
          title: "2016-12-28-MobX - Like React, but for Data",
        
        description: "",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2016/MobX/";
          
        },
      },{id: "post-eventless-xaml-flavoured",
        
          title: "Eventless - XAML Flavoured",
        
        description: "",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2016/Eventless/";
          
        },
      },{id: "post-immuto-epilogue",
        
          title: "Immuto - Epilogue",
        
        description: "",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2016/Immuto-Epilogue/";
          
        },
      },{id: "post-immuto-radical-unification",
        
          title: "Immuto - Radical Unification",
        
        description: "",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2016/Immuto-Radical-Unification/";
          
        },
      },{id: "post-immuto-working-with-react-an-example",
        
          title: "Immuto - Working with React (An Example)",
        
        description: "",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2016/Immuto-React/";
          
        },
      },{id: "post-typescript-what-is-a-class",
        
          title: "TypeScript - What is a class?",
        
        description: "",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2016/TypeScript-Class/";
          
        },
      },{id: "post-immuto-strongly-typed-redux-composition",
        
          title: "Immuto - Strongly Typed Redux Composition",
        
        description: "",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2016/Immuto/";
          
        },
      },{id: "post-typescript-and-runtime-typing-episode-ii",
        
          title: "TypeScript and runtime typing - EPISODE II",
        
        description: "",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2016/TypeScript-RTTI-2/";
          
        },
      },{id: "post-typescript-and-runtime-typing",
        
          title: "TypeScript and runtime typing",
        
        description: "",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2016/TypeScript-RTTI-2/";
          
        },
      },{id: "post-what-39-s-good-about-redux",
        
          title: "What&#39;s good about Redux",
        
        description: "",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2016/Good-Redux/";
          
        },
      },{id: "post-typescript-multicast-functions",
        
          title: "TypeScript multicast functions",
        
        description: "",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2016/TypeScript-multicast/";
          
        },
      },{id: "post-introducing-doop",
        
          title: "Introducing doop",
        
        description: "",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2016/Doop/";
          
        },
      },{id: "post-typescript-is-not-really-a-superset-of-javascript-and-that-is-a-good-thing",
        
          title: "TypeScript is not really a superset of JavaScript and that is a Good...",
        
        description: "",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2015/TypeScript-Superset/";
          
        },
      },{id: "post-a-new-kind-of-managed-lvalue-pointer",
        
          title: "A new kind of managed lvalue pointer",
        
        description: "",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2014/A-new-kind-of-managed-lvalue-pointer/";
          
        },
      },{id: "post-using-pointer-syntax-as-a-shorthand-for-ienumerable",
        
          title: "Using pointer syntax as a shorthand for IEnumerable",
        
        description: "",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2014/Pointers-IEnumerable/";
          
        },
      },{id: "post-adding-crazily-powerful-operator-overloading-to-c-6",
        
          title: "Adding crazily powerful operator overloading to C# 6",
        
        description: "",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2014/Roslyn-Operators/";
          
        },
      },{id: "post-intro-to-javascript-aimed-at-java-programmers",
        
          title: "Intro to JavaScript aimed at Java programmers",
        
        description: "",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2013/Prompt-Engineer-copy/";
          
        },
      },{id: "post-introducing-carota",
        
          title: "Introducing Carota",
        
        description: "",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2013/Introducing-Carota/";
          
        },
      },{id: "books-the-godfather",
          title: 'The Godfather',
          description: "",
          section: "Books",handler: () => {
              window.location.href = "/books/the_godfather/";
            },},{id: "projects-project-1",
          title: 'project 1',
          description: "with background image",
          section: "Projects",handler: () => {
              window.location.href = "/projects/1_project/";
            },},{id: "projects-project-2",
          title: 'project 2',
          description: "a project with a background image and giscus comments",
          section: "Projects",handler: () => {
              window.location.href = "/projects/2_project/";
            },},{id: "projects-project-3-with-very-long-name",
          title: 'project 3 with very long name',
          description: "a project that redirects to another website",
          section: "Projects",handler: () => {
              window.location.href = "/projects/3_project/";
            },},{id: "projects-project-4",
          title: 'project 4',
          description: "another without an image",
          section: "Projects",handler: () => {
              window.location.href = "/projects/4_project/";
            },},{id: "projects-project-5",
          title: 'project 5',
          description: "a project with a background image",
          section: "Projects",handler: () => {
              window.location.href = "/projects/5_project/";
            },},{id: "projects-project-6",
          title: 'project 6',
          description: "a project with no image",
          section: "Projects",handler: () => {
              window.location.href = "/projects/6_project/";
            },},{id: "projects-project-7",
          title: 'project 7',
          description: "with background image",
          section: "Projects",handler: () => {
              window.location.href = "/projects/7_project/";
            },},{id: "projects-project-8",
          title: 'project 8',
          description: "an other project with a background image and giscus comments",
          section: "Projects",handler: () => {
              window.location.href = "/projects/8_project/";
            },},{id: "projects-project-9",
          title: 'project 9',
          description: "another project with an image 🎉",
          section: "Projects",handler: () => {
              window.location.href = "/projects/9_project/";
            },},{
        id: 'social-email',
        title: 'email',
        section: 'Socials',
        handler: () => {
          window.open("mailto:%79%6F%75@%65%78%61%6D%70%6C%65.%63%6F%6D", "_blank");
        },
      },{
        id: 'social-inspire',
        title: 'Inspire HEP',
        section: 'Socials',
        handler: () => {
          window.open("https://inspirehep.net/authors/1010907", "_blank");
        },
      },{
        id: 'social-rss',
        title: 'RSS Feed',
        section: 'Socials',
        handler: () => {
          window.open("/feed.xml", "_blank");
        },
      },{
        id: 'social-scholar',
        title: 'Google Scholar',
        section: 'Socials',
        handler: () => {
          window.open("https://scholar.google.com/citations?user=qc6CJjYAAAAJ", "_blank");
        },
      },{
        id: 'social-custom_social',
        title: 'Custom_social',
        section: 'Socials',
        handler: () => {
          window.open("https://www.alberteinstein.com/", "_blank");
        },
      },{
      id: 'light-theme',
      title: 'Change theme to light',
      description: 'Change the theme of the site to Light',
      section: 'Theme',
      handler: () => {
        setThemeSetting("light");
      },
    },
    {
      id: 'dark-theme',
      title: 'Change theme to dark',
      description: 'Change the theme of the site to Dark',
      section: 'Theme',
      handler: () => {
        setThemeSetting("dark");
      },
    },
    {
      id: 'system-theme',
      title: 'Use system default theme',
      description: 'Change the theme of the site to System Default',
      section: 'Theme',
      handler: () => {
        setThemeSetting("system");
      },
    },];
