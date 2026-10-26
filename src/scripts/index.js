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
    const columns = [...document.querySelectorAll('.terms__column')]
    const terms = [...document.querySelectorAll('.terms details')]
    const homes = new Map(terms.map((term) => [term, term.parentElement]))

    termFilters.forEach((button) => {
        button.addEventListener('click', () => {
            const active = button.getAttribute('aria-pressed') !== 'true'
            const tag = active ? button.dataset.termFilter : ''
            termFilters.forEach((other) => other.setAttribute('aria-pressed', String(active && other === button)))

            // найденные термины раскладываем поровну по колонкам, без фильтра возвращаем на места
            let shown = 0
            terms.forEach((term) => {
                term.hidden = tag !== '' && !term.dataset.tags.split('|').includes(tag)
                const column = tag === '' || term.hidden ? homes.get(term) : columns[shown++ % columns.length]
                column.append(term)
            })
        })
    })
}

// Квиз: по одному вопросу, подсветка ответа с пояснением, в конце уровень
const quiz = document.querySelector('[data-quiz]')

if (quiz) {
    const questions = [...quiz.querySelectorAll('.question')]
    const step = quiz.querySelector('[data-quiz-step]')
    const bar = quiz.querySelector('[data-quiz-bar]')
    const next = quiz.querySelector('[data-quiz-next]')
    const result = quiz.querySelector('[data-quiz-result]')
    const progress = quiz.querySelector('.test__progress')
    const levels = [
        { min: 8, title: 'Вы про', text: 'Вы отлично разбираетесь в основах ИИ. Скоро выйдут квизы посложнее, подпишитесь на рассылку, чтобы не пропустить.' },
        { min: 5, title: 'Уверенный пользователь', text: 'Основы вы знаете. Загляните в статьи, чтобы закрепить: там готовые запросы для работы и дома.' },
        { min: 0, title: 'Пока нуб, но это поправимо', text: 'Начните с глоссария: там главные слова простыми словами. А статьи помогут попробовать нейросеть на настоящих задачах.' }
    ]
    let current = 0
    let score = 0

    const show = (index) => {
        current = index
        questions.forEach((question, i) => (question.hidden = i !== index))
        step.textContent = index + 1
        bar.style.width = `${((index + 1) / questions.length) * 100}%`
        next.hidden = true
        next.textContent = index === questions.length - 1 ? 'Узнать результат' : 'Дальше'
    }

    const reset = () => {
        score = 0
        questions.forEach((question) => {
            question.querySelectorAll('.option').forEach((option) => {
                option.disabled = false
                option.classList.remove('is-correct', 'is-wrong')
            })
            question.querySelector('.question__verdict')?.remove()
            question.querySelector('.question__note').hidden = true
        })
        result.hidden = true
        progress.hidden = false
        show(0)
    }

    questions.forEach((question) => {
        const options = [...question.querySelectorAll('.option')]
        const note = question.querySelector('.question__note')
        options.forEach((option) => {
            option.addEventListener('click', () => {
                const right = option.hasAttribute('data-correct')
                if (right) score++
                options.forEach((other) => {
                    other.disabled = true
                    if (other.hasAttribute('data-correct')) other.classList.add('is-correct')
                })
                if (!right) option.classList.add('is-wrong')
                const verdict = document.createElement('strong')
                verdict.className = 'question__verdict'
                verdict.textContent = right ? 'Верно! ' : 'Не совсем. '
                note.prepend(verdict)
                note.hidden = false
                next.hidden = false
                next.focus()
            })
        })
    })

    next.addEventListener('click', () => {
        if (current < questions.length - 1) {
            show(current + 1)
            questions[current].querySelector('.question__title').focus()
            return
        }
        const level = levels.find((item) => score >= item.min)
        questions[current].hidden = true
        next.hidden = true
        progress.hidden = true
        quiz.querySelector('[data-quiz-score]').textContent = score
        quiz.querySelector('[data-quiz-level]').textContent = level.title
        quiz.querySelector('[data-quiz-text]').textContent = level.text
        result.hidden = false
        quiz.querySelector('[data-quiz-level]').focus()
    })

    quiz.querySelector('[data-quiz-restart]').addEventListener('click', () => {
        reset()
        questions[0].querySelector('.question__title').focus()
    })

    reset()
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
