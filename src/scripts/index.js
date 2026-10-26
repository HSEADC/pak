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
            button.textContent = 'Текст выделен, скопируйте его'
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

// Страница статей: фильтр по рубрикам, повторный клик снимает фильтр
const filters = [...document.querySelectorAll('[data-filter]')]

if (filters.length) {
    const catalog = document.querySelector('.catalog')
    const cards = [...catalog.querySelectorAll('[data-rubric]')]
    const grids = [...catalog.querySelectorAll('.news__grid')]
    const empty = catalog.querySelector('.catalog__empty')

    filters.forEach((button) => {
        button.addEventListener('click', () => {
            const active = button.getAttribute('aria-pressed') !== 'true'
            const rubric = active ? button.dataset.filter : ''
            filters.forEach((other) => other.setAttribute('aria-pressed', String(active && other === button)))
            catalog.classList.toggle('is-filtered', active)
            cards.forEach((card) => {
                card.hidden = rubric !== '' && card.dataset.rubric !== rubric
            })
            grids.forEach((grid) => {
                grid.hidden = [...grid.children].every((card) => card.hidden)
            })
            empty.hidden = cards.some((card) => !card.hidden)
        })
    })
}

// Глоссарий: фильтр терминов по темам, повторный клик снимает фильтр
const termFilters = [...document.querySelectorAll('[data-term-filter]')]

if (termFilters.length) {
    const terms = [...document.querySelectorAll('.terms details')]

    termFilters.forEach((button) => {
        button.addEventListener('click', () => {
            const active = button.getAttribute('aria-pressed') !== 'true'
            const tag = active ? button.dataset.termFilter : ''
            termFilters.forEach((other) => other.setAttribute('aria-pressed', String(active && other === button)))
            terms.forEach((term) => {
                term.hidden = tag !== '' && !term.dataset.tags.split('|').includes(tag)
            })
        })
    })
}

// 404: глаза маскота следят за курсором
const eyes = document.querySelector('.notfound__eyes')

if (eyes && !reduced) {
    const mascot = eyes.parentElement

    addEventListener('pointermove', (event) => {
        // центр глаз считаем от маскота, а не от самих глаз, чтобы сдвиг не влиял на расчёт
        const box = mascot.getBoundingClientRect()
        const dx = event.clientX - (box.left + box.width / 2)
        const dy = event.clientY - (box.top + box.height * 0.435)
        const distance = Math.hypot(dx, dy) || 1
        // максимальный сдвиг — 6% ширины маскота, ближе к глазам сдвиг меньше
        const limit = mascot.offsetWidth * 0.06
        const shift = Math.min(limit, distance / 8)
        eyes.style.setProperty('--eye-x', `${((dx / distance) * shift).toFixed(1)}px`)
        eyes.style.setProperty('--eye-y', `${((dy / distance) * shift * 0.7).toFixed(1)}px`)
    }, { passive: true })

    document.addEventListener('pointerleave', () => {
        eyes.style.setProperty('--eye-x', '0px')
        eyes.style.setProperty('--eye-y', '0px')
    })
}
