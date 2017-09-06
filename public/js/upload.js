zip.workerScriptsPath = "/js/zipjs/"

if(canDragDrop) {
  var $form = $("form")
  var $dragdrop = $form.find(".dragdrop")

  var droppedFiles = false

  $form.on("drag dragstart dragend dragover dragenter dragleave drop", function(e) {
    e.preventDefault()
    e.stopPropagation()
  })
  .on("dragover dragenter", function(e) {
    $form.addClass("is-dragover")
  })
  .on("dragleave dragend drop", function(e) {
    $form.removeClass("is-dragover")
  })
  .on("drop", function(e) {
    if(!droppedFiles) {
      droppedFiles = e.originalEvent.dataTransfer.files
      var file = droppedFiles[0]
      $dragdrop.text("Just a sec...")
      console.log(droppedFiles)

      // perform some pre-checks
      if(file && file.name.split(".")[file.name.split(".").length - 1].toLowerCase() === "makerbot"){
        $form.find("input[type=\"file\"]").prop("files", droppedFiles)

        // okay, now let's try to unzip it
        zip.createReader(new zip.BlobReader(file), function(reader) {
          reader.getEntries(function(entries) {
            $dragdrop.hide()
            $(".preview").addClass("show")

            entries.forEach(function(entry) {
              switch(entry.filename) {
                case "thumbnail_320x200.png":
                  entry.getData(new zip.Data64URIWriter(), function(uri) {
                    $(".form .preview .image").css("background-image", "url(" + uri + ")")
                  }, function(e) { })
                  break
                case "meta.json":
                  entry.getData(new zip.TextWriter(), function(json) {
                    var meta = JSON.parse(json)
                    console.log(meta)

                    $(".name").text(file.name.slice(0, -9))
                    $(".print-time").text("Estimated print time: " + moment.duration(meta.duration_s, "seconds").humanize())
                    $(".filament-used").text("Estimated filament usage: " + meta.extrusion_mass_g.toFixed(2) + "g")
                  }, function(e) { })
                  break
              }
            })
          })
        }, function(err) {
          console.error(err)
          $dragdrop.text("Error processing .makerbot file. Try again.")
          droppedFiles = null
        })
      }else{
        $dragdrop.text("That's not a valid .makerbot file. Try again.")
        droppedFiles = null
      }
    }
  })
}else{
  $(".dragdrop").text("Please upgrade to a modern browser to upload a print")
}