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
        cr.div({ class: 'col-lg-4 col-lg-offset-4 col-sm-12' },
          cr.div({ class: 'box' },
            cr.h2('Volume'),
            cr.div({ class: 'volume-container' },
              cr.input({ type: 'range', min: '1', max: '100', value: '50', class: 'volume', id: 'volume', on: { change: (e) => { volumeChange(e) } } })
            )
          )
        )
      ),
      cr.div({ class: 'row' },
        cr.div({ class: 'col-lg-4 col-lg-offset-4 col-sm-12' },
          cr.div({ class: 'box' },
            cr.h2('Input'),
            cr.div({ class: 'row middle-xs is-centered' },
              cr.div({ class: 'col-lg-3' }, 'Input 1'),
              cr.div({ class: 'col-lg-3' }, 'Input 2'),
              cr.div({ class: 'col-lg-3' }, 'Input 3'),
              cr.div({ class: 'col-lg-3' }, 'Input 4')
            )
          )
        )
      ),
      cr.div({ class: 'row' },
        cr.div({ class: 'col-lg-4 col-lg-offset-4 col-sm-12' },
          cr.a({ href: '#settings' },
            cr.div({ class: 'box' },
              cr.div({ class: 'row middle-xs' },
                cr.div({ class: 'col-xs' },
                  cr.h2('Settings'),
                  cr.p('Change input names, set volumes and update firmware')
                ),
                cr.div({ class: 'col-xs fixed-52' }
                  // <svg class='chevron pure-flex-middle-xs' xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='9 18 15 12 9 6'></polyline></svg>
                )
              )
            )
          )
        )
      )
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
    firmware: cr.div(
      cr.div({ class: 'row' },
        cr.div({ class: 'col-lg-4 col-lg-offset-4 col-sm-12' },
          cr.div({ class: 'box' },
            cr.h2('Firmware version'),
            cr.p('Firmware: ', cr.span({ id: 'firmware-version' })),
            cr.p('Application: ')
          )
        )
      ),
      cr.div({ class: 'row' },
        cr.div({ class: 'col-lg-4 col-lg-offset-4 col-sm-12' },
          cr.label({ for: 'update-file', class: 'is-clickable' },
            cr.div({ class: 'box' },
              cr.div({ class: 'row middle-xs' },
                cr.div({ class: 'col-xs' },
                  cr.h2('Firmware update'),
                  cr.p('Update the device firmware')
                ),
                cr.div({ class: 'col-xs fixed-52' }
                // <svg class: 'chevron pure-flex-middle-xs' xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='9 18 15 12 9 6'></polyline></svg>
                ),
                cr.input({ type: 'file', id: 'update-file', class: 'is-hidden', on: { change: (e) => { uploadOTA(e) } } })
              )
            )
          )
        )
      )
    )
  }

  callback(pages[fragmentId])
}
