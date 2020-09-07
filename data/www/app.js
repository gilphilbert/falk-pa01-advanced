function loadContent () {
  var contentDiv = document.getElementById('app')
  var fragmentId = window.location.hash.substr(1)

  getContent(fragmentId, function (content) {
    contentDiv.childNodes.forEach((v) => {
      v.remove()
    })
    contentDiv.appendChild(content)
    const cr = crel.proxy

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
            if (data.inputs) {
              data.inputs.list.forEach((v) => {
                document.getElementById('input-container').appendChild(
                  cr.div({ class: 'col-xs-3' },
                    cr.div({ class: 'pointer input-box' + ((data.inputs.selected == v.id) ? ' selected' : ''), 'data-id': v.id, on: { click: function() { inputChange(this) } } },
                      getSVG(v.icon),
                      cr.span(v.name)
                    )
                  )
                )
              })
            }
          })
        break
        case 'inputs':
          window.fetch('/api/inputs')
            .then(response => response.json())
            .then(data => {
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
        case 'wifi':
          window.fetch('/api/networks')
            .then(response => response.json())
            .then(data => {
              var df = new DocumentFragment;
              data.forEach(v => {
                console.log(v)
                df.appendChild(
                  cr.div({ class: 'row middle-xs' },
                    cr.div({ class: 'col-xs vpad nogrow' },
                      getSVG(getWifiIcon(v.signal, v.security), 'icon-sm')
                    ),
                    cr.div({ class: 'col-xs' },
                      v.ssid
                    )
                  )
                )
              })
              document.getElementById('network-list').firstChild.remove();
              document.getElementById('network-list').appendChild(df);
            })
          break
    }
  })
}

var getSVG = function (iconName, cls) {
  var svgElem = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svgElem.classList.add('icon')
  var useElem = document.createElementNS('http://www.w3.org/2000/svg', 'use')
  useElem.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', 'icons/icons.svg#' + iconName)
  svgElem.appendChild(useElem)
  if (cls) {
    cls.split(' ').forEach(c => svgElem.classList.add(c))
  }
  return svgElem
}

function getWifiIcon(rssi, secure) {
  var icon = 'wifi-'
  if (rssi >= -30) {
    icon += '4'
  } else if (rssi >= -67) {
    icon += '3'
  } else if (rssi >= -70) {
    icon += '2'
  } else if (rssi >= -80) {
    icon += '1'
  } else {
    icon += '0'
  }
  if (secure != "OPEN") {
    icon += '-secure'
  }
  return icon
}

function volumeChange(e) {
  body = JSON.stringify({
    volume: parseInt(e.target.value)
  })
  window.fetch('/api/volume', { method: 'POST', body: body })
    .then(response => response.json())
    .then(data => {
      console.log(data)
    })
}

function inputChange(el) {
  body = JSON.stringify({
    input: parseInt(el.closest('.input-box').dataset['id'])
  })
  window.fetch('/api/input', { method: 'POST', body: body })
    .then(response => response.json())
    .then(data => {
      console.log(data)
      document.querySelectorAll('.input-box').forEach((el) => {
        if (el.dataset['id'] == data.selected) {
          el.classList.add("selected")
        } else {
          el.classList.remove("selected")
        }
      })
    })
}

//var progress = -1
var uploading = false
function uploadOTA (event) {
  if (uploading == true) {
    return;
  }
  document.getElementById('update-file').setAttribute('disabled', true)
  this.uploading = true
  const formData = new FormData()
  if (event !== null) {
    this.file = event.target.files[0]
  }
  if (this.file.name != "spiffs.bin" && this.file.name != "firmware.bin") {
    document.getElementById('error-message').innerHTML = "Invalid firmware file! Select either <strong>firmware.bin</strong> or <strong>application.bin</strong>"
    document.getElementById('error-container').classList.remove('hidden');
    return;
  } else if (this.file.name == 'firmware.bin') {
    document.getElementById('update-type').innerText = "firmware"
  } else {
    document.getElementById('update-type').innerText = "application"
  }
  document.getElementById('error-container').classList.add('hidden');
  formData.append(this.type, this.file, this.type)
  const request = new XMLHttpRequest()
  request.addEventListener('load', () => {
    var OTASuccess = false
    var OTAError = false
    // request.response will hold the response from the server
    if (request.status === 200) {
      document.getElementById('progress-container').classList.add('hidden')
      document.getElementById('success-container').classList.remove('hidden');
    } else if (request.status !== 500) {
      document.getElementById('error-message').innerText = `[HTTP ERROR] ${request.statusText}`
      document.getElementById('error-container').classList.remove('hidden');
    } else {
      document.getElementById('error-message').innerText = request.responseText
      document.getElementById('error-container').classList.remove('hidden');
    }
    uploading = false
    document.getElementById('update-file').setAttribute('disabled', false)
  })
  // Upload progress
  request.upload.addEventListener('progress', (e) => {
    var progress = Math.trunc((e.loaded / e.total) * 100)
    document.getElementById('update-progress').value = progress
    document.getElementById('update-percentage').innerText = progress
  })
  request.open('post', '/update')
  request.send(formData)
  document.getElementById('progress-container').classList.remove('hidden')
}

window.addEventListener('DOMContentLoaded', (event) => {
  if (!window.location.hash) {
    window.location.hash = '#main'
  }

  loadContent()

  window.addEventListener('hashchange', loadContent)
})
