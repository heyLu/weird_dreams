(ns obj.core
  (:use [obj.render :only (render render-with set-attributes!)]))

(defn obj-of [el]
  (.-obj el))

(defn abs-pos-renderer [parent-node objs]
  (doseq [obj objs]
    (let [obj-el (render obj)]
      (set-attributes! obj-el
                       {:style {:position "absolute"
                                :top "0px"
                                :left "0px"}})
      (.appendChild parent-node obj-el))))

(.send
 (js/req
  (js-obj
   "url" "../obj.json"
   "cb" (fn [ev]
          (let [req (.-target ev)]
            (when (= (.-readyState req) js/XMLHttpRequest.DONE)
              (let [data (js->clj (js/JSON.parse (.-responseText req)))]
                (abs-pos-renderer js/document.body (map clj->js (vals (get data "objects")))))))))))

(def ^:dynamic drag nil)

(defn start-move-obj [ev]
  (when (.-ctrlKey ev)
    (let [el (.-target ev)]
      (set! drag
            {:el el
             :elStart {:x (.-offsetLeft el)
                       :y (.-offsetTop el)}
             :mouseStart {:x (.-clientX ev)
                          :y (.-clientY ev)}})
      (.preventDefault ev))))

(defn assoc-in* [m & kvs]
  (reduce (fn [m [sel v]]
            (assoc-in m sel v))
          m
          (partition 2 kvs)))

(defn move-obj [ev]
  (when-not (nil? drag)
    (let [{{ex :x ey :y} :elStart
           {sx :x sy :y} :mouseStart} drag
           mx (.-clientX ev)
           my (.-clientY ev)]
      (set-attributes! (:el drag)
                       {:style {:left (str (+ ex mx (- sx)) "px")
                                :top  (str (+ ey my (- sy)) "px")}}))))

(defn stop-move-obj [ev]
  (set! drag nil))

(defn replace-element [old new]
  (let [parent (.-parentElement old)]
    (.replaceChild parent new old)))

(defn toggle-raw-view [ev]
  (when (.-shiftKey ev)
    (let [el (.-target ev)
          raw? (= (.toLowerCase (.-tagName el)) "code")
          obj (obj-of el)
          toggled-el (if raw?
                       (render obj)
                       (render-with "default" obj))]
      (set-attributes! toggled-el {:style {:position "absolute"}})
      (replace-element el toggled-el))))

(doto js/document
  (.addEventListener "mousedown" start-move-obj)
  (.addEventListener "mousemove" move-obj)
  (.addEventListener "mouseup" stop-move-obj)

  (.addEventListener "mousedown" toggle-raw-view))
