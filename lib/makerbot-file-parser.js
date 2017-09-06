const unzip = require('unzip')

module.exports = {
  parse: function(stream) {
    return new Promise((resolve, reject) => {
      var meta
      var image

      stream.pipe(unzip.Parse())
        .on("entry", entry => {
          var file = ""
          switch(entry.path){
            case "meta.json":
              entry.on("data", data => file += data)
              entry.on("end", () => {
                try{
                  meta = JSON.parse(file)
                }catch(e){
                  reject("Error parsing meta.json", e)
                }
              })
              break
            case "thumbnail_320x200.png":
              entry.on("data", data => file += data)
              entry.on("end", () => {
                image = file
              })
              break
            default:
              entry.autodrain()
              break
          }
        })
        .on("close", () => {
          if(meta && image){
            resolve({ meta, image })
          }else{
            reject("Bad MakerBot file")
          }
        })
    })
  }
}