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

## Open questions/problems

* how to handle nested collections?
    - e.g. have a list inside the root collection and want to reorder the
      lists elements
    - "focus" on a collection, e.g. only handle events from within that one?
      (would need event handling mechanism, not so pretty; or at least make
       event handlers ask if their target is currently "active"?)
* where to store rendering information?
    - e.g. positions for absolute positioning renderer
    - for "list" this is implicit: the order in the collection is the order
      in the rendered list, would reordering mean changing the collection?
      (yes, that's the point of a list)
    - we want to enable rendering a collection multiple times on screen and
      keep rendering and data separate -> do we really need to duplicate
      the collection?

          ["doc1" "doc2" "doc3" "img1"] ; real collection

          {"doc1" {:x 0 :y 0}
           "doc2" {:x 0 :y 150}
           "doc3" {x: 500 :y 0}
           "img1" {x: 700 :y 350}}

    - now some renderers are just that, and others use and change the collections
      structure (e.g. moving in a list means moving in the collection)
