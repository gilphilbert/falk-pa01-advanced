const debugmode = true;

var sysStatus = {};

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
        case 'wireless':
          if (debugmode) {
            data=[{ssid: 'Glibertvue', signal: -30, security: 'WEP'},{ssid: 'Snowbaby', signal: -80, security: 'OPEN'}]
            buildWiFi(data)
          } else {
            window.fetch('/api/networks')
            .then(response => response.json())
            .then(data => {
              buildWiFi(data)
            })
          }
          break
    }
  })
}

function buildWiFi(data) {
  const cr = crel.proxy
  var df = new DocumentFragment;
  data.forEach(v => {
    var w = getWiFiDetail(v.signal, v.security);
    df.appendChild(
      cr.div({ class: 'row middle-xs padded pointer', 'data-network': JSON.stringify(v), on: { click: () => { console.log(v) }} },
        cr.div({ class: 'col-xs col-xs-middle nogrow' },
          getSVG(w.icon, 'no-stroke')
        ),
        cr.div({ class: 'col-xs' },
          cr.h4(v.ssid),cr.p({class:'text-sm'}, w.text)
        ),
        cr.div({ class: 'col-xs col-xs-middle nogrow' },
          cr.div(cr.span({ class: 'button button-sm button-hidden' }, 'Connect'))
        )
      )
    )
  })
  document.getElementById('network-list').firstChild.remove();
  document.getElementById('network-list').appendChild(df);
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

function getSVG(name, cls) {
  var data = window.icons['pre'] + window.icons[name] + window.icons['post']
  var el = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  //el.setAttribute('viewbox', '0 0 24 24')
  el.classList.add('icon')

  const parser = new DOMParser()
  const parsed = parser.parseFromString(data, 'image/svg+xml')

  let svg = parsed.getElementsByTagName('svg')[0]

  while (svg.childNodes.length) {
    el.appendChild(svg.childNodes[0])
  }

  if (cls) {
    cls.split(' ').forEach(c => el.classList.add(c))
  }

  return el
}

function getWiFiDetail(rssi, secure) {
  var icon = 'wifi-'
  var str = 'Signal: '
  if (rssi >= -30) {
    icon += '4'
    str += 'Great'
  } else if (rssi >= -67) {
    icon += '3'
    str += 'Good'
  } else if (rssi >= -70) {
    icon += '2'
    str += 'Average'
  } else if (rssi >= -80) {
    icon += '1'
    str += 'Poor'
  } else {
    icon += '0'
    str += 'Bad'
  }
  if (secure != "OPEN") {
    icon += '-secure'
  } else {
    str += ' (Insecure)'
  }
  return { icon: icon, text: str }
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
    })
}

function setDim(e) {
  body = JSON.stringify({
    state: ((e.target.checked==false) ? 0 : 1)
  })
  window.fetch('/api/settings/dim', { method: 'POST', body: body })
    .then(response => response.json())
    .then(data => {
      console.log(data)
    })
    .catch(() => {
      e.target.checked = !e.target.checked;
    })
}

function setAbsoluteVolume(e) {
  body = JSON.stringify({
    state: ((e.target.checked==false) ? 0 : 1)
  })
  window.fetch('/api/settings/absoluteVol', { method: 'POST', body: body })
    .then(response => response.json())
    .then(data => {
      console.log(data)
    })
    .catch(() => {
      e.target.checked = !e.target.checked;
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
  if (this.file.name != "spiffs.bin" && this.file.name != "spiffs.bin.gz" && this.file.name != "firmware.bin") {
    document.getElementById('error-message').innerHTML = "Invalid firmware file! Select either <strong>firmware.bin</strong> or <strong>application.bin</strong>"
    document.getElementById('error-container').classList.remove('hidden');
    return;
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

  if (debugmode) {
    sysStatus = {"volume":{"current":68,"max":255,"maxAllowedVol":255,"maxStartVol":255},"inputs":[{"id":1,"name":"CD","icon":"disc","selected":true,"enabled":1},{"id":2,"name":"Input 2","icon":"disc","selected":false,"enabled":1},{"id":3,"name":"Input 3","icon":"disc","selected":false,"enabled":1},{"id":4,"name":"Input 4","icon":"disc","selected":false,"enabled":1}],"settings":{"dim":0,"absoluteVol":1,"wifi_ssid":""},"firmware":{"fw":"0.1.10"}}
    loadContent()
    window.addEventListener('hashchange', loadContent)
  } else {

    if (!!window.EventSource) {
      var source = new EventSource('/events');
    
      source.addEventListener('open', function(e) {
        console.log("Subscribed to events");
      }, false);
    
      source.addEventListener('error', function(e) {
        if (e.target.readyState != EventSource.OPEN) {
          console.log("Disconnected from event server");
        }
      }, false);
    
      source.addEventListener('message', function(e) {
        var obj = JSON.parse(e.data);
        var key = Object.keys(obj)[0];
        switch(key) {

          case 'volume':
            sysStatus.volume.current = obj[key];
            var el =document.querySelector("#volume");
            if (el != null) {
              el.value = obj[key]
            }
            break;

          case 'input':
            for(var i = 0; i < sysStatus.inputs.length; i++) {
              if (obj[key] == sysStatus.inputs[i].id) {
                sysStatus.inputs[i].selected = true
              } else {
                sysStatus.inputs[i].selected = false
              }
            }
            var el =document.querySelectorAll("#input-container .input-box .indicator");
            if (el != null) {
              el.forEach(e => {
                if (sysStatus.inputs[e.parentNode.dataset.id - 1].selected) {
                  e.classList.add("selected")
                } else {
                  e.classList.remove("selected")
                }
              })
            }
            break;

          default:
            console.log("message", e.data);
        }
      }, false);
    }
    
    window.fetch('/api/status')
    .then(response => response.json())
    .then(data => {
        sysStatus = data
        console.log(sysStatus)
        loadContent()
        window.addEventListener('hashchange', loadContent)
      }
    )
    }
})
