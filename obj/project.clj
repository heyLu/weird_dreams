(defproject obj "0.1.0-SNAPSHOT"
  :description "objects: everything is an object, data & rendering are separate"
  :dependencies [[org.clojure/clojure "1.5.1"]
                 [org.clojure/clojurescript "0.0-1843"]]
  :plugins [[lein-cljsbuild "0.3.3"]]
  :cljsbuild {
    :builds {
      :main {
        :source-paths ["src-cljs"]}}})
