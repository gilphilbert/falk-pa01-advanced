function getContent(fragmentId, callback) {
  const cr = crel.proxy
  crel.attrMap['on'] = (element, value) => {
    for (const eventName in value) {
      element.addEventListener(eventName, value[eventName])
    }
  }
  var pages = {
    main: cr.div(
      cr.div({ class: 'row' },
        cr.div({ class: 'col-lg-4 col-lg-offset-4 col-xs-12' },
          cr.div({ class: 'box' },
            cr.h2('Volume'),
            cr.div({ class: 'row' },
              cr.div({ class: 'col-xs nogrow' },
                cr.img({ src: 'volume.svg' })
              ),
              cr.div({ class: 'col-xs' },
                cr.div({ class: 'volume-container' },
                  cr.input({ type: 'range', min: '1', max: '100', value: '20', class: 'volume', id: 'volume', on: { change: (e) => { volumeChange(e) } } })
                )
              )
            )
          )
        )
      ),
      cr.div({ class: 'row' },
        cr.div({ class: 'col-lg-4 col-lg-offset-4 col-xs-12' },
          cr.div({ class: 'box' },
            cr.h2('Input'),
            cr.div({ class: 'row middle-xs center-xs', id: 'input-container' })
          )
        )
      ),
      cr.div({ class: 'row' },
        cr.div({ class: 'col-lg-4 col-lg-offset-4 col-xs-12' },
          cr.div({ class: 'box' },
            cr.h2('Settings'),
            cr.div({ class: 'row middle-xs' },
              cr.div({ class: 'col-xs' },
                cr.a({ href: '#settings' },
                  cr.span({ class: 'button-round'}, cr.img({ src: 'settings.svg' }))
                )
              )
            )
          )
        )
      ),
    ),
    settings: cr.div(
      cr.div({ class: 'row' },
        cr.div({ class: 'col-lg-4 col-lg-offset-4 col-sm-12' },
          cr.div({ class: 'box' },
            cr.div({ class: 'row middle-xs' },
              cr.div({ class: 'col-xs' },
                cr.h2('Input names'),
                cr.p('Your inputs are names, not numbers!')
              ),
              cr.div({ class: 'col-xs fixed-52' }
              // svg class: 'chevron pure-flex-middle-xs' xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='9 18 15 12 9 6'></polyline></svg>
              )
            )
          )
        )
      ),
      cr.div({ class: 'row' },
        cr.div({ class: 'col-lg-4 col-lg-offset-4 col-sm-12' },
          cr.div({ class: 'box' },
            cr.div({ class: 'row middle-xs' },
              cr.div({ class: 'col-xs' },
                cr.h2('Dim screen'),
                cr.p('Screen too bright? Dim automatically after 10s')
              ),
              cr.div({ class: 'col-xs fixed-52' },
                cr.label({ class: 'switch pure-flex-middle-xs' },
                  cr.input({ type: 'checkbox', id: 'dim-screen' }),
                  cr.span({ class: 'slider round' })
                )
              )
            )
          )
        )
      ),
      cr.div({ class: 'row' },
        cr.div({ class: 'col-lg-4 col-lg-offset-4 col-sm-12' },
          cr.div({ class: 'box' },
            cr.div({ class: 'row middle-xs' },
              cr.div({ class: 'col-xs' },
                cr.h2('Maximum volume'),
                cr.p('Protect your equipment (and your ears) by limiting volume')
              ),
              cr.div({ class: 'col-xs fixed-52' }
              // svg class: 'chevron pure-flex-middle-xs' xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='9 18 15 12 9 6'></polyline></svg>
              )
            )
          )
        )
      ),
      cr.div({ class: 'row' },
        cr.div({ class: 'col-lg-4 col-lg-offset-4 col-sm-12' },
          cr.div({ class: 'box' },
            cr.div({ class: 'row middle-xs' },
              cr.div({ class: 'col-xs' },
                cr.h2('Startup volume'),
                cr.p('Keep making yourself jump? Set a maximum startup volume')
              ),
              cr.div({ class: 'col-xs fixed-52' }
              // svg class: 'chevron pure-flex-middle-xs' xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='9 18 15 12 9 6'></polyline></svg>
              )
            )
          )
        )
      ),
      cr.div({ class: 'row' },
        cr.div({ class: 'col-lg-4 col-lg-offset-4 col-sm-12' },
          cr.a({ href: '#wifi' },
            cr.div({ class: 'box' },
              cr.div({ class: 'row middle-xs' },
                cr.div({ class: 'col-xs' },
                  cr.h2('Wireless'),
                  cr.p('Connect this device to your Wifi')
                ),
                cr.div({ class: 'col-xs fixed-52' }
                // svg class: 'chevron pure-flex-middle-xs' xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='9 18 15 12 9 6'></polyline></svg>
                )
              )
            )
          )
        )
      ),
      cr.div({ class: 'row' },
        cr.div({ class: 'col-lg-4 col-lg-offset-4 col-sm-12' },
          cr.a({ href: '#firmware' },
            cr.div({ class: 'box' },
              cr.div({ class: 'row middle-xs' },
                cr.div({ class: 'col-xs' },
                  cr.h2('Firmware'),
                  cr.p('Manage this device\'s firmware')
                ),
                cr.div({ class: 'col-xs fixed-52' }
                // svg class: 'chevron pure-flex-middle-xs' xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='9 18 15 12 9 6'></polyline></svg>
                )
              )
            )
          )
        )
      )
    ),
    wifi: cr.div(
      cr.div({ class: 'row' },
        cr.div({ class: 'col-lg-4 col-lg-offset-4 col-sm-12' },
          cr.div({ class: 'box' },
            cr.h2('Select a WiFi network:'),
            cr.div({ id: 'network-list' },
              cr.p('Scanning...')
            )
          )
        )
      )
    ),
    firmware: cr.div(
      cr.div({ class: 'row' },
        cr.div({ class: 'col-lg-4 col-lg-offset-4 col-sm-12' },
          cr.div({ class: 'box' },
            cr.h2('Firmware version'),
            cr.p('Firmware: ', cr.span({ id: 'firmware-version' })),
            cr.p('Application: ', cr.span({ id: 'application-version' }))
          )
        )
      ),
      cr.div({ class: 'row' },
        cr.div({ class: 'col-lg-4 col-lg-offset-4 col-sm-12' },
          cr.div({ class: 'box' },
            cr.div({ class: 'row middle-xs' },
              cr.div({ class: 'col-xs' },
                cr.h2('Firmware update'),
                cr.label({ for: 'update-file', class: 'is-clickable' },
                  cr.span({ class: 'button-round'}, cr.img({ src: 'upload.svg' }))
                ),
                cr.progress({ id: 'update-progress', class: 'hidden', max: 100, min: 0, value: 0 }),
                cr.input({ type: 'file', id: 'update-file', class: 'hidden', on: { change: (e) => { uploadOTA(e) } } }),
                cr.p({ id: 'update-success', class: 'hidden' }, 'Firmware updated sucessfully')
              )
            )
          )
        )
      )
    )
  }

  callback(pages[fragmentId])
}
