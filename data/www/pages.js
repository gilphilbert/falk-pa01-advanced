function getContent(fragmentId, callback) {
  crel.attrMap['on'] = (element, value) => {
    for (const eventName in value) {
      element.addEventListener(eventName, value[eventName])
    }
  }
  var pages = {
    main: cr.div (
      cr.div({ class: 'row' },
        cr.div({ class: 'col-lg-4 col-lg-offset-4 col-xs-12' },
          cr.h2('Volume'),
          cr.div({ class: 'row box' },
            cr.div({ class: 'col-xs nogrow' },
              getSVG('volume')
            ),
            cr.div({ class: 'col-xs' },
              cr.div({ class: 'volume-container' },
                cr.input({ type: 'range', min: '1', max: sysStatus.volume.max, value: sysStatus.volume.current, class: 'volume', id: 'volume', on: { change: (e) => { volumeChange(e) } } })
              )
            )
          )
        ),
      ),
      cr.div({ class: 'row' },
        cr.div({ class: 'col-lg-4 col-lg-offset-4 col-xs-12' },
          cr.h2('Input'),
          cr.div({ class: 'row center-content nomargin', id: 'input-container' },
            sysStatus.inputs.map(e => {
              if (e.enabled == true) {
                return cr.div({ class: 'col-xs-6 col-md-3' },
                  cr.label(
                    cr.div({ class: 'pointer input-box', 'data-id': e.id, on: { click: function() { inputChange(this) } } },
                      getSVG(e.icon, 'inline-block'),
                      cr.span(e.name),
                      //cr.input({ type: 'radio' })
                      cr.div({ class: 'indicator' + ((e.selected) ? ' selected' : '') })
                    )
                  )
                )
              } else {
                return false
              }
            })
          )
        )
      ),
    ),
    inputs: cr.div(
      cr.div({ class: 'row'},
        cr.div({ class: 'col-lg-4 col-lg-offset-4 col-xs-12' },
          cr.h2('Settings'),
          cr.div({ class: 'tabs' },
            cr.ul(
              cr.li({ class: 'selected'}, cr.a({ href: '#inputs' }, 'Inputs')),
              cr.li(cr.a({ href: '#system' }, 'System')),
              cr.li(cr.a({ href: '#wireless' }, 'Wireless')),
              cr.li(cr.a({ href: '#firmware' }, 'Firmware')),
            )
          )
        )
      ),
      cr.div({ id: 'settings-container' },
        cr.div({ class: 'row' },
          cr.div({ class: 'col-lg-4 col-lg-offset-4 col-xs-12' },
            cr.p('Select an input to edit'),
            sysStatus.inputs.map(v => {
              return cr.div({ class: 'row  middle-xs padded pointer' + ((v.enabled) ? '' : 'disabled'), 'data-id': v.id, 'data-name': v.name, 'data-icon': v.icon, 'data-enabled': v.enabled, on: { click: (e) => { showModalInput(e); } } },
                cr.div({ class: "col-xs nogrow" },
                  getSVG(v.icon)
                ),
                cr.div({ class: "col-xs" },
                  v.name
                ),
                cr.div({ class: "col-xs nogrow" },
                  cr.span({ class: 'button button-sm button-hidden' }, 'Edit')
                )
              )
            })
          )
        )
      )
    ),
    system: cr.div(
      cr.div({ class: 'row'},
        cr.div({ class: 'col-lg-4 col-lg-offset-4 col-xs-12' },
          cr.h2('Settings'),
          cr.div({ class: 'tabs' },
            cr.ul(
              cr.li(cr.a({ href: '#inputs' }, 'Inputs')),
              cr.li({ class: 'selected'}, cr.a({ href: '#system' }, 'System')),
              cr.li(cr.a({ href: '#wireless' }, 'Wireless')),
              cr.li(cr.a({ href: '#firmware' }, 'Firmware')),
            )
          )
        )
      ),
      cr.div({ id: 'settings-container' },
        cr.div({ class: 'row' },
          cr.div({ class: 'col-lg-6 col-lg-offset-4 col-xs-12' },
            cr.p('Change system settings that affect the display and audio'),
            cr.fieldset(
              cr.h3('Dim screen'),
              cr.p({ class: 'subtitle' }, 'Automatically dims the screen to a lower level after 10 seconds'),
              cr.label({ class: 'switch' },
                ((sysStatus.settings.dim) ?
                  cr.input({ type: 'checkbox', id: 'settings-dim', checked: 'checked', on: { change: (e) => { setDim(e) } } })
                :
                  cr.input({ type: 'checkbox', id: 'settings-dim', on: { change: (e) => { setDim(e) } } })
                ),
                cr.span({ class: 'slider round' })
              ),
            ),
            cr.fieldset(
              cr.h3('Absolute Volume'),
              cr.p({ class: 'subtitle' }, 'Show the actual volume level (0-255) instead of a percentage'),
              cr.label({ class: 'switch' },
                ((sysStatus.settings.absoluteVol) ?
                  cr.input({ type: 'checkbox', id: 'settings-absolute-vol', checked: 'checked', on: { change: (e) => { setAbsoluteVolume(e) } } })
                :
                  cr.input({ type: 'checkbox', id: 'settings-absolute-vol', on: { change: (e) => { setAbsoluteVolume(e) } } })
                ),
                cr.span({ class: 'slider round' })
              ),
            ),
            cr.fieldset(
              cr.h3('Maximum volume'),
              cr.p({ class: 'subtitle' }, 'Set the maximum volume that can be set to protect your equipment and ears'),
              cr.span({ class: 'addon' },
                cr.button({ on: { click: () => {
                  var n = parseInt(document.getElementById('max-allowed-vol').value) - 1
                  if (n > 0) {
                    document.getElementById('max-allowed-vol').value = n
                    setMaxVolume(n)
                  }
                } } }, '<'),
                cr.input({ type: 'number', id: 'max-allowed-vol', value: sysStatus.volume.maxAllowedVol, on: { 
                  keypress: (e) => { if (e.which != 8 && e.which != 0 && e.which < 48 || e.which > 57) { e.preventDefault() } },
                  change: () => {
                    var n = parseInt(document.getElementById('max-allowed-vol').value)
                    if (n > sysStatus.volume.maxAllowedVol) {
                      document.getElementById('max-allowed-vol').value = sysStatus.volume.maxAllowedVol
                    } else if (n < 0) {
                      document.getElementById('max-allowed-vol').value = 0
                    }
                    setMaxVolume(n)
                  } }
                }),
                cr.button({ on: { click: () => {
                  var n = parseInt(document.getElementById('max-allowed-vol').value) + 1
                  if (n <= sysStatus.volume.maxAllowedVol) {
                    document.getElementById('max-allowed-vol').value = n
                    setMaxVolume(n)
                  }
                } } }, '>'),
              ),
            ),
            cr.fieldset(
              cr.h3('Maximum startup volume'),
              cr.p({ class: 'subtitle' }, 'Turn on with a reduced volume, useful if you listen to music loud when nobody\'s home'),
              cr.span({ class: 'addon' },
                cr.button({ on: { click: () => {
                  var n = parseInt(document.getElementById('max-startup-vol').value) - 1
                  if (n > 0) {
                    document.getElementById('max-startup-vol').value = n
                    setMaxStartupVolume(n)
                  }
                } } }, '<'),
                cr.input({ type: 'number', id: 'max-startup-vol', value: sysStatus.volume.maxStartVol, on: { 
                  keypress: (e) => { if (e.which != 8 && e.which != 0 && e.which < 48 || e.which > 57) { e.preventDefault() } },
                  change: () => {
                    var n = parseInt(document.getElementById('max-startup-vol').value)
                    if (n > sysStatus.volume.maxStartVol) {
                      document.getElementById('max-startup-vol').value = sysStatus.volume.maxStartVol
                    } else if (n < 0) {
                      document.getElementById('max-startup-vol').value = 0
                    }
                    setMaxStartupVolume(n)
                  } }
                }),
                cr.button({ on: { click: () => {
                  var n = parseInt(document.getElementById('max-startup-vol').value) + 1
                  if (n <= sysStatus.volume.maxStartVol) {
                    document.getElementById('max-startup-vol').value = n
                    setMaxStartupVolume(n)
                  }
                } } }, '>'),
              )
            ),
            // <!--------------------------------------------------------------------------------------------------
            // <!-------------------------------------------------------------------------------------------------- needs a verification step
            // <!--------------------------------------------------------------------------------------------------
            cr.fieldset(
              cr.h3('Factory reset'),
              cr.p({ class: 'subtitle' }, 'Reset the device back to factory defaults - this will reset all inputs and any network settings'),
              cr.button({ class: 'button danger', on: { click: () => { factoryReset() } } }, 'Factory reset')
            ),
          )
        )
      )
    ),
    wireless: cr.div(
      cr.div({ class: 'row'},
        cr.div({ class: 'col-lg-4 col-lg-offset-4 col-xs-12' },
          cr.h2('Settings'),
          cr.div({ class: 'tabs' },
            cr.ul(
              cr.li(cr.a({ href: '#inputs' }, 'Inputs')),
              cr.li(cr.a({ href: '#system' }, 'System')),
              cr.li({ class: 'selected'}, cr.a({ href: '#wireless' }, 'Wireless')),
              cr.li(cr.a({ href: '#firmware' }, 'Firmware')),
            )
          )
        )
      ),
      cr.div({ id: 'settings-container' },
        cr.div({ class: 'row' },
          cr.div({ class: 'col-lg-4 col-lg-offset-4 col-xs-12' },
            cr.p('Connect to a wireless network'),
            cr.div({ id: 'network-list' },
              cr.p('Scanning...', getSVG('rotate-cw', 'spinner')),
            )
          )
        )
      )
    ),
    firmware: cr.div(
      cr.div({ class: 'row'},
        cr.div({ class: 'col-lg-4 col-lg-offset-4 col-xs-12' },
          cr.h2('Settings'),
          cr.div({ class: 'tabs' },
            cr.ul(
              cr.li(cr.a({ href: '#inputs' }, 'Inputs')),
              cr.li(cr.a({ href: '#system' }, 'System')),
              cr.li(cr.a({ href: '#wireless' }, 'Wireless')),
              cr.li({ class: 'selected'}, cr.a({ href: '#firmware' }, 'Firmware')),
            )
          )
        )
      ),
      cr.div({ id: 'settings-container' },
        cr.div({ class: 'row' },
          cr.div({ class: 'col-lg-4 col-lg-offset-4 col-xs-12' },
            cr.p('View and update firmware'),
            cr.fieldset(
            cr.h3('Current firmware'),
              cr.p({ class: 'subtitle' }, sysStatus.firmware.fw)
            ),
            cr.label({ for: 'update-file', class: 'pointer' },
              cr.span({ class: 'button'}, 'Update'),
              cr.input({ type: 'file', id: 'update-file', class: 'hidden', on: { change: (e) => { uploadOTA(e) } } }),
            ),
            cr.div({ class: 'hidden', id: 'progress-container' },
              cr.h3('Update progress'),
              cr.p('Uploading (', cr.span({ id: 'update-percentage' }), '%)'),
              cr.progress({ id: 'update-progress', max: 100, min: 0, value: 50 }),
              cr.div({ class: 'message warning' },
                cr.div({ class: 'heading' }, 'Do not power off'),
                'Please wait while the update is installed. Do not power off or unplug the unit until it has completely restarted.'
              )
            ),
            cr.div({ class: 'hidden', id: 'success-container' },
              cr.div({ class: 'message success' },
                cr.div({ class: 'heading' }, 'Firmware updated sucessfully'),
                cr.span({ class: 'block pointer', on: { click: () => { window.location.reload() } } }, 'Click here to reload the web UI')
              )
            ),
            cr.div({ class: 'hidden', id: 'error-container' },
              cr.div({ class: 'message danger' },
                cr.div({ class: 'heading' }, 'Update error'),
                cr.span({ id: 'error-message'})
              )
            )
          )
        )   
      )
    )
  }

  callback(pages[fragmentId])
}
