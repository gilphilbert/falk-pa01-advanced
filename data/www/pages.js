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
              return cr.div({ class: 'row  middle-xs padded pointer' + ((v.enabled) ? '' : 'disabled'), 'data-id': v.id, 'data-name': v.name, 'data-icon': v.icon, 'data-enabled': v.enabled, on: { click: (e) => { editInput(e); } } },
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
              cr.p({ class: 'subtitle' }, 'Automatically dims the screen to a lower level after 10 seconds. May extend the life of your display (recommended)'),
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
              cr.p({ class: 'subtitle' }, 'Show the actual volume level (0-' + sysStatus.volume.max + ') instead of a percentage'),
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
              cr.button({ class: 'button danger', on: { click: () => { document.getElementById('reset-page').classList.add('shown') } } }, 'Factory reset')
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
                cr.div({ class: 'heading' }, 'Firmware downloaded successfully'),
                cr.span({ class: 'block pointer', on: { click: () => { window.location.reload() } } }, 'The firmware will now be installed. Check the front of the unit for progress. Click here to reload the web UI once the update is complete')
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

window.icons = {
  'pre': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">',
  'post': '</svg>',

  'music': '<path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle>',
  'network': '<path d=" M 9 2 L 9 8 L 15 8 L 15 2 L 9 2 Z " /><path d=" M 12 8 L 12 12 M 12 12 L 5 12 L 5 16 M 12 12 L 19 12 L 19 16" /><path d=" M 8 16 L 2 16 L 2 22 L 8 22 L 8 16 Z " /><path d=" M 16 16 L 16 22 L 22 22 L 22 16 L 16 16 Z " />',
  'disc': '<circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="3"></circle>',
  'hard-drive': '<line x1="22" y1="12" x2="2" y2="12"></line><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path><line x1="6" y1="16" x2="6.01" y2="16"></line><line x1="10" y1="16" x2="10.01" y2="16"></line>',
  'laptop': '<path d="M6 16.4h12"></path><path d="M17 7H7v7h10V7z"></path>',
  'radio': '<circle cx="12" cy="12" r="2"></circle><path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14"></path>',

  'volume': '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>',
  'settings': '<circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>',
  'chevron-right': '<polyline points="9 18 15 12 9 6"></polyline>',
  'plus': '<line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>',
  'minus': '<line x1="5" y1="12" x2="19" y2="12"></line>',
  'lock': '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path>',
  'rotate-cw': '<polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>',
  'unlock': '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path>',

  'wifi-0': '<path d=" M 12.01 21.526 L 24 6.588 C 23.536 6.237 18.918 2.464 12 2.464 C 5.072 2.464 0.464 6.237 0 6.588 L 11.99 21.526 L 12 21.536 L 12.01 21.526 Z " fill="rgb(225,225,225)"/>',
  'wifi-1': '<path d=" M 12.01 21.526 L 24 6.588 C 23.536 6.237 18.918 2.464 12 2.464 C 5.072 2.464 0.464 6.237 0 6.588 L 11.99 21.526 L 12 21.536 L 12.01 21.526 Z " fill="rgb(225,225,225)"/><path d=" M 17.056 15.24 L 12.01 21.526 L 12 21.536 L 11.99 21.526 L 6.944 15.24 C 8.321 14.705 10.032 14.28 12 14.28 C 13.968 14.28 15.679 14.705 17.056 15.24 Z " fill="rgb(77,132,195)"/>',
  'wifi-2': '<path d=" M 12.01 21.526 L 24 6.588 C 23.536 6.237 18.918 2.464 12 2.464 C 5.072 2.464 0.464 6.237 0 6.588 L 11.99 21.526 L 12 21.536 L 12.01 21.526 Z " fill="rgb(225,225,225)"/><path d=" M 19.058 12.745 L 12.01 21.526 L 12 21.536 L 11.99 21.526 L 4.942 12.745 C 6.463 11.873 8.917 10.829 12 10.829 C 15.083 10.829 17.537 11.873 19.058 12.745 Z " fill="rgb(77,132,195)"/>',
  'wifi-3': '<path d=" M 12.01 21.526 L 24 6.588 C 23.536 6.237 18.918 2.464 12 2.464 C 5.072 2.464 0.464 6.237 0 6.588 L 11.99 21.526 L 12 21.536 L 12.01 21.526 Z " fill="rgb(225,225,225)"/><path d=" M 2.273 9.42 L 11.989 21.525 L 12 21.536 L 12.011 21.525 L 21.727 9.42 C 21.233 9.041 17.524 6.033 12 6.033 C 6.476 6.033 2.767 9.041 2.273 9.42 Z " fill="rgb(77,132,195)"/>',
  'wifi-4': '<path d=" M 12.01 21.526 L 24 6.588 C 23.536 6.237 18.918 2.464 12 2.464 C 5.072 2.464 0.464 6.237 0 6.588 L 11.99 21.526 L 12 21.536 L 12.01 21.526 Z " fill="rgb(77,132,195)"/>',

  'wifi-0-secure': '<path d=" M 12.01 21.526 L 24 6.588 C 23.536 6.237 18.918 2.464 12 2.464 C 5.072 2.464 0.464 6.237 0 6.588 L 11.99 21.526 L 12 21.536 L 12.01 21.526 Z " fill="rgb(225,225,225)"/>',
  'wifi-1-secure': '<path d=" M 12.01 21.526 L 24 6.588 C 23.536 6.237 18.918 2.464 12 2.464 C 5.072 2.464 0.464 6.237 0 6.588 L 11.99 21.526 L 12 21.536 L 12.01 21.526 Z " fill="rgb(225,225,225)"/><path d=" M 17.056 15.24 L 12.01 21.526 L 12 21.536 L 11.99 21.526 L 6.944 15.24 C 8.321 14.705 10.032 14.28 12 14.28 C 13.968 14.28 15.679 14.705 17.056 15.24 Z " fill="rgb(77,132,195)"/>',
  'wifi-2-secure': '<path d=" M 12.01 21.526 L 24 6.588 C 23.536 6.237 18.918 2.464 12 2.464 C 5.072 2.464 0.464 6.237 0 6.588 L 11.99 21.526 L 12 21.536 L 12.01 21.526 Z " fill="rgb(225,225,225)"/><path d=" M 19.058 12.745 L 12.01 21.526 L 12 21.536 L 11.99 21.526 L 4.942 12.745 C 6.463 11.873 8.917 10.829 12 10.829 C 15.083 10.829 17.537 11.873 19.058 12.745 Z " fill="rgb(77,132,195)"/>',
  'wifi-3-secure': '<path d=" M 12.01 21.526 L 24 6.588 C 23.536 6.237 18.918 2.464 12 2.464 C 5.072 2.464 0.464 6.237 0 6.588 L 11.99 21.526 L 12 21.536 L 12.01 21.526 Z " fill="rgb(225,225,225)"/><path d=" M 2.273 9.42 L 11.989 21.525 L 12 21.536 L 12.011 21.525 L 21.727 9.42 C 21.233 9.041 17.524 6.033 12 6.033 C 6.476 6.033 2.767 9.041 2.273 9.42 Z " fill="rgb(77,132,195)"/>',
  'wifi-4-secure': '<path d=" M 12.01 21.526 L 24 6.588 C 23.536 6.237 18.918 2.464 12 2.464 C 5.072 2.464 0.464 6.237 0 6.588 L 11.99 21.526 L 12 21.536 L 12.01 21.526 Z " fill="rgb(77,132,195)"/>'
}