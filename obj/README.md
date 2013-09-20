# .obj - everything is data, can be rendered and edited

What if everything you see on a webpage would be simple data, rendered
by customizable renderers? Well, you could easily mash-up data from
multiple sources, such as audio from soundcloud and youtube and time a
presentation to it, whatever.

This is what I explore in here

## How do I run this?

Glad you asked, it should be simple:

    # in terminal #1, recompile the cljs code on saves
    $ lein cljsbuild auto
    # in terminal #2, start a small server
    $ cd ..
    $ python -m http.server
    # (could be any server, will likely be clj later)
    
And then point your browser to <http://localhost:8000/obj/index.html>.

Have fun!
