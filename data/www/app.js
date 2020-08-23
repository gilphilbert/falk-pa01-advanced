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
            document.getElementById('volume').value = data.volume
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
  console.log(e.target.value)
  window.fetch('/api/firmware', { method: 'POST', body: e.target.value })
    .then(response => response.json())
    .then(data => {
      console.log(data.volume)
    })
}

var OTASuccess = false
var OTAError = false
var uploading = false
var progress = -1
function uploadOTA (event) {
  this.uploading = true
  const formData = new FormData()
  if (event !== null) {
    this.file = event.target.files[0]
  }
  formData.append(this.type, this.file, this.type)
  const request = new XMLHttpRequest()
  request.addEventListener('load', () => {
    // request.response will hold the response from the server
    if (request.status === 200) {
      OTASuccess = true
    } else if (request.status !== 500) {
      OTAError = `[HTTP ERROR] ${request.statusText}`
    } else {
      OTAError = request.responseText
    }
    uploading = false
    progress = 0
    console.log('here')
    console.log(OTAError)
  })
  // Upload progress
  request.upload.addEventListener('progress', (e) => {
    progress = Math.trunc((e.loaded / e.total) * 100)
    console.log(progress)
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
