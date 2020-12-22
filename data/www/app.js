const debugmode = ((window.location.hostname == '127.0.0.1') ? true : false)

var sysStatus = {}

const cr = crel.proxy

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

/* DOM helpers */

function buildWiFi(data) {
  var df = new DocumentFragment
  data.forEach(v => {
    var w = getWiFiDetail(v.signal, v.security)
    df.appendChild(
      cr.div({ class: 'row middle-xs padded pointer', 'data-network': JSON.stringify(v), on: { click: () => { keyWiFi(v) }} },
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
  document.getElementById('network-list').firstChild.remove()
  document.getElementById('network-list').appendChild(df)
}

function keyWiFi(data) {
  var container = document.getElementById("settings-container")
  container.firstChild.remove()

  container.appendChild(
    cr.div({ class: 'row' },
      cr.div({ class: 'col-lg-4 col-lg-offset-4 col-xs-12' },
        cr.p('Connect to a wireless network'),
        cr.fieldset(
          cr.h3('Wireless password for ' + data.ssid),
          cr.p({ class: 'subtitle' }, 'Enter your wireless password/key to connect to the network'),
          cr.input({ type: 'password', id: 'wifi-key' }),
          cr.span({ class: 'helper danger', id: 'connect-helper' })
        ),
        cr.button({ class: 'button outline', on: { click: (e) => { loadContent() } } }, 'Cancel'),
        cr.button({ class: 'button', id: 'connect-button', on: { click: (e) => { connectWiFi(e.target, data.ssid) } } }, 'Connect')
      )
    )
  )

  container.querySelector('#wifi-key').focus()
}

/* helpers */

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

/* API functions */

function volumeChange(e) {
  body = JSON.stringify({
    volume: parseInt(e.target.value)
  })
  window.fetch('/api/volume', { method: 'POST', body: body })
}

function inputChange(el) {
  body = JSON.stringify({
    input: parseInt(el.closest('.input-box').dataset['id'])
  })
  window.fetch('/api/input', { method: 'POST', body: body })
}

function setDim(e) {
  body = JSON.stringify({
    state: ((e.target.checked==false) ? 0 : 1)
  })
  window.fetch('/api/settings/dim', { method: 'POST', body: body })
    .catch(() => {
      e.target.checked = !e.target.checked
    })
}

function setAbsoluteVolume(e) {
  body = JSON.stringify({
    state: ((e.target.checked==false) ? 0 : 1)
  })
  window.fetch('/api/settings/absoluteVol', { method: 'POST', body: body })
    .catch(() => {
      e.target.checked = !e.target.checked
    })
}

function setMaxVolume(v) {
  body = JSON.stringify({ value: v })
  window.fetch('/api/settings/maxVol', { method: 'POST', body: body })
}
function setMaxStartupVolume(v) {
  body = JSON.stringify({ value: v })
  window.fetch('/api/settings/maxStartupVol', { method: 'POST', body: body })
}

function connectWiFi(btn, ssid) {
  var key = document.getElementById('wifi-key').value
  btn.disabled = true
  btn.innerText = "Connecting..."
  document.getElementById('connect-helper').innerText = ''
  body = JSON.stringify({
    ssid: ssid,
    key: key
  })
  //we won't get anything from this request
  window.fetch('/api/setWireless', { method: 'POST', body: body })
}

function factoryReset() {
  //we won't get anything from this request
  window.fetch('/api/factoryReset', { method: 'POST', body: '{ "check": true }' })
  //we'll get disconnected, so we should say goodbye!
}


//var progress = -1
var uploading = false
function uploadOTA (event) {
  if (uploading == true) {
    return
  }
  document.getElementById('update-file').setAttribute('disabled', true)
  this.uploading = true
  const formData = new FormData()
  if (event !== null) {
    this.file = event.target.files[0]
  }
  if (this.file.name != "spiffs.bin" && this.file.name != "spiffs.bin.gz" && this.file.name != "firmware.bin") {
    document.getElementById('error-message').innerHTML = "Invalid firmware file! Select either <strong>firmware.bin</strong> or <strong>application.bin</strong>"
    document.getElementById('error-container').classList.remove('hidden')
    return
  }
  document.getElementById('error-container').classList.add('hidden')
  formData.append(this.type, this.file, this.type)
  const request = new XMLHttpRequest()
  request.addEventListener('load', () => {
    var OTASuccess = false
    var OTAError = false
    // request.response will hold the response from the server
    if (request.status === 200) {
      document.getElementById('progress-container').classList.add('hidden')
      document.getElementById('success-container').classList.remove('hidden')
    } else if (request.status !== 500) {
      document.getElementById('error-message').innerText = `[HTTP ERROR] ${request.statusText}`
      document.getElementById('error-container').classList.remove('hidden')
    } else {
      document.getElementById('error-message').innerText = request.responseText
      document.getElementById('error-container').classList.remove('hidden')
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

/* application loader */

window.addEventListener('DOMContentLoaded', (event) => {
  if (!window.location.hash) {
    window.location.hash = '#main'
  }

  if (debugmode) {
    sysStatus = {"volume":{"current":68,"max":255,"maxAllowedVol":255,"maxStartVol":255},"inputs":[{"id":1,"name":"CD","icon":"disc","selected":true,"enabled":1},{"id":2,"name":"Input 2","icon":"disc","selected":false,"enabled":1},{"id":3,"name":"Input 3","icon":"disc","selected":false,"enabled":1},{"id":4,"name":"Input 4","icon":"disc","selected":false,"enabled":1}],"settings":{"dim":0,"absoluteVol":1,"wifi_ssid":""},"firmware":{"fw":"0.1.10"},"ipaddr":""}
    loadContent()
    window.addEventListener('hashchange', loadContent)
  } else {

    if (!!window.EventSource) {
      var source = new EventSource('/events')
    
      source.addEventListener('open', function(e) {
        console.log("Subscribed to events")
        if (debugmode == false)
          document.getElementById('banner').classList.remove('drop')
      }, false)
    
      source.addEventListener('error', function(e) {
        if (e.target.readyState != EventSource.OPEN) {
          console.log("Disconnected from event server")
          if (debugmode == false)
            document.getElementById('banner').classList.add('drop')
        }
      }, false)
    
      source.addEventListener('message', function(e) {
        var obj = JSON.parse(e.data)
        var key = Object.keys(obj)[0]
        switch(key) {

          case 'volume':
            sysStatus.volume.current = obj[key]
            var el =document.querySelector("#volume")
            if (el != null) {
              el.value = obj[key]
            }
            break

          case 'input':
            for(var i = 0; i < sysStatus.inputs.length; i++) {
              if (obj[key] == sysStatus.inputs[i].id) {
                sysStatus.inputs[i].selected = true
              } else {
                sysStatus.inputs[i].selected = false
              }
            }
            var el =document.querySelectorAll("#input-container .input-box .indicator")
            if (el != null) {
              el.forEach(e => {
                if (sysStatus.inputs[e.parentNode.dataset.id - 1].selected) {
                  e.classList.add("selected")
                } else {
                  e.classList.remove("selected")
                }
              })
            }
            break

          case 'wireless':
            var data = JSON.parse(obj[key])
            if (data.status==true) {
              //connection successful, show that page here...
              var el =document.getElementById('settings-container')
              el.firstChild.remove()
              el.appendChild(
                cr.div({ class: 'row' },
                  cr.div({ class: 'col-lg-4 col-lg-offset-4 col-xs-12' },
                    cr.h2('Connection successful'),
                    cr.p({ class: 'subtitle' }, 'This device is now connected to your wireless network.'),
                    cr.p('You should now manage your device using it\'s address on your network: http://' + data.ipaddr + '. Connect to your wireless network then click the button below.'),
                    cr.a({ href: 'http://' + data.ipaddr, class: 'button' }, 'Go to new address')
                  )
                )
              )
              //should probably show the wifi/how to find this device (mDNS, etc.)
              sysStatus.settings.wifi_ssid = data.ssid
              sysStatus.ip_address = data.ipaddr
            } else {
              var el = document.getElementById('connect-button')
              el.disabled = false
              el.innerText = 'Connect'
              el = document.getElementById('connect-helper').innerText = "Connect failed, try entering key again"
              document.getElementById('wifi-key').value = ''
            }
            break

          default:
            console.log("message", e.data)
        }
      }, false)
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

function editInput(e) {
  data = e.target.closest('.row').dataset
  console.log(data);
  var icons = ['music', 'radio', 'disc', 'laptop', 'network']
  var el =document.getElementById('settings-container')
  el.firstChild.remove()
  el.appendChild(
    cr.div({ class: 'row' },
      cr.div({ class: 'col-lg-4 col-lg-offset-4 col-xs-12' },
        cr.p('Edit Input ' + data.id),
        cr.fieldset(
          cr.h3('Name'),
          cr.input({ type: 'text', id: 'input-name', value: data.name }),
          //cr.span({ class: 'helper danger', id: 'connect-helper' })
        ),
        cr.fieldset(
          cr.h3('Icon'),
          cr.div({ class: 'row center-content' },
            icons.map((v) => {
              var c = cr.label({ class: 'input-selector' }, getSVG(v))
              if(v == data.icon) {
                c.appendChild(cr.input({ type: 'radio', value: v, name: 'input-icon', checked: true }))
              } else {
                c.appendChild(cr.input({ type: 'radio', value: v, name: 'input-icon' }))
              }
              c.appendChild(cr.span({ class: 'selector' }))
              return cr.div({ class: 'col-xs-2'}, c);
            })
          )
          //cr.span({ class: 'helper danger', id: 'connect-helper' })
        ),
        cr.fieldset(
          cr.h3('Enabled'), 
          cr.label({ class: 'switch' },
            ((data.enabled) ?
              cr.input({ type: 'checkbox', id: 'input-enabled', checked: 'checked' })
            :
              cr.input({ type: 'checkbox', id: 'input-enabled' })
            ),
            cr.span({ class: 'slider round' })
          ),
        ),
        cr.button({ class: 'button outline', on: { click: (e) => { loadContent() } } }, 'Cancel'),
        cr.button({ class: 'button', id: 'connect-button', on: { click: (e) => {
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
                sysStatus.inputs[parseInt(data.id)].name = document.querySelector('#input-name').value
                sysStatus.inputs[parseInt(data.id)].enabled = document.querySelector('#input-enabled').checked
                sysStatus.inputs[parseInt(data.id)].icon = document.querySelector('input[name="input-icon"]:checked').value
                loadContent()
              } else {
                console.log('failed')
              }
            })
        } } }, 'Save')
      )
    )
  )
}