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
              if(data.list) {
                var df = new DocumentFragment;
                data.list.forEach(v => {
                  df.appendChild(
                    cr.div({ class: 'row middle-xs padded' + ((v.enabled) ? '' : ' disabled'), 'data-id': v.id, 'data-name': v.name, 'data-icon': v.icon, 'data-enabled': v.enabled },
                      cr.div({ class: 'col-xs nogrow' },
                        getSVG(v.icon)
                      ),
                      cr.div({ class: 'col-xs' },
                        v.name
                      ),
                      cr.div({ class: 'col-xs nogrow' },
                        cr.span({ class: 'button-round sm', on: { click: (e) => { showModalInput(e); } } }, getSVG('settings'))
                      )
                    )
                  )
                })
                document.getElementById('input-list').childNodes.forEach(v => { v.remove() })
                document.getElementById('input-list').appendChild(df)
              }
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
                  cr.div({ class: 'row middle-xs padded' },
                    cr.div({ class: 'col-xs nogrow' },
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

function showModalInput(e) {
  const cr = crel.proxy
  data = e.target.closest('.row').dataset
  var df = new DocumentFragment();
  df.appendChild(
    cr.div({ class: 'modal-body' },
      cr.h2('Edit input'),
      cr.fieldset(
        cr.label({ for: 'input-name' },
            cr.p('Name'),
            cr.input({ type: 'text', id: 'input-name', name: 'input-name', value: data.name })
        )
      ),
      cr.fieldset(
        cr.label(
          cr.p('Icon'),
          cr.div({ class: 'row' },
            cr.label({ class: 'col-xs' }, getSVG('music', 'inline-block'), cr.input({ type: 'radio', value: 'music', name: 'input-icon' })),
            cr.label({ class: 'col-xs' }, getSVG('radio', 'inline-block'), cr.input({ type: 'radio', value: 'radio', name: 'input-icon' })),
            cr.label({ class: 'col-xs' }, getSVG('disc', 'inline-block'), cr.input({ type: 'radio', value: 'disc', name: 'input-icon' })),
            cr.label({ class: 'col-xs' }, getSVG('laptop', 'inline-block'), cr.input({ type: 'radio', value: 'laptop', name: 'input-icon' })),
            cr.label({ class: 'col-xs' }, getSVG('network', 'inline-block'), cr.input({ type: 'radio', value: 'network', name: 'input-icon' }))
          )
        )
      ),
      cr.fieldset(
        cr.label({ class: 'check-container' }, 'Enabled',
            cr.input({ type: 'checkbox', id: 'input-enabled' }),
            cr.span({ class: 'checkmark' })
        )
      )
    )
  )
  df.querySelectorAll('input[type="radio"]').forEach(v => {
    if (v.value == data.icon) {
      v.setAttribute('checked', 'checked')
    }
  })
  if (data.enabled == true) {
    df.querySelector('input[type="checkbox"]').setAttribute('checked', 'checked')
  }
  df.appendChild(
    cr.div({ class: 'modal-footer two' },
        cr.button({ class: 'cancel', on: { click: (e) => { hideModal(); } } }, 'Cancel'),
        cr.button({ class: 'save', on: { click: () => { 
          body = JSON.stringify({
            input: parseInt(data.id),
            name: document.querySelector('#input-name').value,
            icon: document.querySelector('input[name="input-icon"]:checked').value,
            enabled: ((document.querySelector('#input-enabled').checked == true) ? 1 : 0)
          })
          window.fetch('/api/input', { method: 'PUT', body: body })
            .then(response => response.json())
            .then(data => {
              if (data.status == "ok") {
                loadContent();
                hideModal();
              }
            })
        } } }, 'Save')
    )
  )
  showModal(df)
}

function showModal(content) {
  var mc = document.querySelector('#modal .modal-content')
  while(mc.hasChildNodes()) {
    mc.removeChild(mc.firstChild);
  }
  mc.appendChild(content)
  document.getElementById('modal').classList.remove('hidden')
}
function hideModal() {
  document.getElementById('modal').classList.add('hidden')
}

var getSVG = function (iconName, cls) {
  var svgElem = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svgElem.classList.add('icon')
  var useElem = document.createElementNS('http://www.w3.org/2000/svg', 'use')
  useElem.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', 'icons/icons.svg#' + iconName)
  svgElem.appendChild(useElem)
  if (cls) {
    cls.split(' ').forEach(c => svgElem.classList.add(c))
  }a
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
