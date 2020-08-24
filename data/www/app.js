function loadContent () {
  var contentDiv = document.getElementById('app')
  var fragmentId = window.location.hash.substr(1)

  getContent(fragmentId, function (content) {
    contentDiv.childNodes.forEach((v) => {
      v.remove()
    })
    contentDiv.appendChild(content)

    // get any data relevant for this page
    switch (fragmentId) {
      case 'main':
        window.fetch('/api/status')
          .then(response => response.json())
          .then(data => {
            //document.getElementById('volume').value = Math.round((data.volume.current / data.volume.max) * 100)
            document.getElementById('volume').max = data.volume.max
            document.getElementById('volume').value = data.volume.current
            console.log(data)
          })
        break
      case 'firmware':
        window.fetch('/api/firmware')
          .then(response => response.json())
          .then(data => {
            document.getElementById('firmware-version').innerText = data.fw
            document.getElementById('application-version').innerText = data.app
          })
        break
    }
  })
}

function volumeChange(e) {
  console.log("Goal::" + e.target.value)
  body = {
    volume: e.target.value
  }
  window.fetch('/api/volume', { method: 'POST', body: JSON.stringify(body) })
    .then(response => response.json())
    .then(data => {
      console.log(data)
    })
}
//var progress = -1
var uploading = false
function uploadOTA (event) {
  document.getElementById('update-progress').classList.remove('is-hidden')
  this.uploading = true
  const formData = new FormData()
  if (event !== null) {
    this.file = event.target.files[0]
  }
  formData.append(this.type, this.file, this.type)
  const request = new XMLHttpRequest()
  request.addEventListener('load', () => {
    var OTASuccess = false
    var OTAError = false
    // request.response will hold the response from the server
    if (request.status === 200) {
      OTASuccess = true
    } else if (request.status !== 500) {
      OTAError = `[HTTP ERROR] ${request.statusText}`
    } else {
      OTAError = request.responseText
    }
    uploading = false
    //progress = 0
    if (OTASuccess == true) {
      document.getElementById('update-success').classList.remove('is-hidden');
    } else {
      console.log(OTAError)
    }
  })
  // Upload progress
  request.upload.addEventListener('progress', (e) => {
    var progress = Math.trunc((e.loaded / e.total) * 100)
    document.getElementById('update-progress').value = progress
  })
  request.open('post', '/update')
  request.send(formData)
}

window.addEventListener('DOMContentLoaded', (event) => {
  if (!window.location.hash) {
    window.location.hash = '#main'
  }

  loadContent()

  window.addEventListener('hashchange', loadContent)
})
