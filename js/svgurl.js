/* a drawing as a data: URL, for an <img> (the browser then keeps it as a picture: cheap for big still things like the
   forest bands; its CSS classes no longer move and nothing outside its box shows). On its own, so the pixel look
   (pixel.js) needn't bring all of Duck Cabin's drawings (hangout/art.js) with it */
export const svgDataURL = (svg) =>
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(
    /^<svg[^>]*\sxmlns=/.test(svg)
      ? svg
      : svg.replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" '),
  ); // (a drawing that names its xmlns already keeps just the one: twice, and Firefox shows a broken picture)
