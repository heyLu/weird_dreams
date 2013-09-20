(ns obj.render)

(defn set-attributes! [obj attributes]
  (doseq [[k v] attributes]
    (if (map? v)
      (set-attributes! (aget obj (name k)) v)
      (aset obj (name k) v))))

(defn create-element [tag & attributes]
  (let [attributes (if attributes
                     (apply assoc {} attributes)
                     {})
        el (js/document.createElement tag)]
    (set-attributes! el attributes)
    el))

(def ^:dynamic *renderers*
  {"default" (fn [obj]
              (create-element "code"
                              :textContent (js/JSON.stringify obj nil "  ")
                              :contentEditable true))
   "audio" (fn [obj]
            (create-element "audio"
                            :controls true
                            :src (.-url obj)))
   "page" (fn [obj]
            (let [page-el (create-element "iframe"
                                          :src (.-url obj)
                                          :style {:pointerEvents "none"
                                                  :backgroundColor "white"})]
              (doto (create-element "div")
                (.appendChild page-el))))
   "image" (fn [obj]
             (create-element "img"
                             :src (.-url obj)
                             :style {:maxWidth "300px"}))
   "video/vimeo" (fn [obj]
                   (let [id (str "vimeo" (.-id obj))
                         opts (str "?api=1&title=0&byline=0&portrait=0&player_id=" id)
                         iframe (create-element "iframe"
                                                :id id
                                                :src (str "http://player.vimeo.com/video/" (.-id obj) opts)
                                                :width "400px"
                                                :height "300px"
                                                :style {:pointerEvents "none"})]
                     (when (.-time obj)
                       (aset iframe :onload
                             (fn []
                               (doto (js/vimeo iframe)
                                 (.seekTo (.-time obj))
                                 (.pause)))))
                     (doto (create-element "div")
                       (.appendChild iframe)
                       (.addEventListener "click"
                                          (fn [ev]
                                            (when (not (.-ctrlKey ev))
                                              (.playPause (js/vimeo iframe))))))))
  })

(defn ^:export render [obj]
  (let [renderer (or (get *renderers* (.-type obj))
                     (get *renderers* "default"))]
    (renderer obj)))
