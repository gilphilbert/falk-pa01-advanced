function getContent(fragmentId, callback) {
  const cr = crel.proxy
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
          cr.div({ class: 'row center-content', id: 'input-container' },
            sysStatus.inputs.map(e => {
              if (e.enabled == true) {
                return cr.div({ class: 'col-xs-6 col-md-3' },
                  cr.div({ class: 'pointer input-box' + ((e.selected) ? ' selected' : ''), 'data-id': e.id, on: { click: function() { inputChange(this) } } },
                    getSVG(e.icon, 'inline-block'),
                    cr.span(e.name),
                    cr.input({ type: 'radio' })
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
            cr.table(
              sysStatus.inputs.map(v => {
                return cr.tr({ class: ((v.enabled) ? '' : 'disabled'), 'data-id': v.id, 'data-name': v.name, 'data-icon': v.icon, 'data-enabled': v.enabled },
                  cr.td({ class: "shrink" },
                    getSVG(v.icon)
                  ),
                  cr.td({ class: "expand" },
                    v.name
                  ),
                  cr.td({ class: "shrink" },
                    cr.span({ class: 'pointer', on: { click: (e) => { showModalInput(e); } } }, getSVG('settings', 'icon-hover'))
                  )
                )
              })
            )
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
          cr.div({ class: 'col-lg-4 col-lg-offset-4 col-xs-12' },
            cr.p('Change system settings that affect the display and audio'),
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
            cr.h3('Maximum volume'),
            cr.p({ class: 'subtitle' }, 'Set the maximum volume that can be set to protect your equipment and ears'),
            cr.span({ class: 'addon' },
              cr.button('<'),
              cr.input({ type: 'number', value: sysStatus.volume.maxAllowedVol }),
              cr.button('>'),
            ),
            cr.h3('Maximum startup volume'),
            cr.p({ class: 'subtitle' }, 'Turn on with a reduced volume, useful if you listen to music loud when nobody\'s home'),
            cr.span({ class: 'addon' },
              cr.button('<'),
              cr.input({ type: 'number', value: sysStatus.volume.maxStartVol }),
              cr.button('>'),
            )
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
            cr.h3('Current firmware'),
            cr.p({ class: 'subtitle' }, sysStatus.firmware.fw),
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
