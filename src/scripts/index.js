// «Попробуйте сами»: переключение задач и копирование запроса
const tabs = [...document.querySelectorAll('.try__tasks [role="tab"]')]
const panels = tabs.map((tab) => document.getElementById(tab.getAttribute('aria-controls')))

function selectTab(index, focus = false) {
    tabs.forEach((tab, i) => {
        const active = i === index
        tab.setAttribute('aria-selected', String(active))
        tab.tabIndex = active ? 0 : -1
        panels[i].hidden = !active
    })
    if (focus) tabs[index].focus()
}

tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => selectTab(i))
    tab.addEventListener('keydown', (event) => {
        const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key]
        if (!step) return
        event.preventDefault()
        selectTab((i + step + tabs.length) % tabs.length, true)
    })
})

if (tabs.length) selectTab(0)

document.querySelectorAll('[data-copy]').forEach((button) => {
    const label = button.textContent
    button.addEventListener('click', async () => {
        const text = button.closest('.prompt').querySelector('.prompt__text').textContent
        try {
            await navigator.clipboard.writeText(text)
            button.textContent = 'Скопировано'
        } catch {
            const range = document.createRange()
            range.selectNodeContents(button.closest('.prompt').querySelector('.prompt__text'))
            getSelection().removeAllRanges()
            getSelection().addRange(range)
            button.textContent = 'Выделено, нажмите Ctrl+C'
        }
        setTimeout(() => (button.textContent = label), 2000)
    })
})

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches

// Медленный дрейф архивных фото при прокрутке
const drifting = [...document.querySelectorAll('[data-drift]')]

if (!reduced && drifting.length) {
    let ticking = false
    const update = () => {
        drifting.forEach((el) => {
            const rect = el.getBoundingClientRect()
            const progress = (rect.top + rect.height / 2 - innerHeight / 2) / innerHeight
            el.style.setProperty('--drift', `${(progress * -24).toFixed(1)}px`)
        })
        ticking = false
    }
    addEventListener('scroll', () => {
        if (!ticking) requestAnimationFrame(update)
        ticking = true
    }, { passive: true })
    update()
}
