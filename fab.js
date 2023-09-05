class FAB extends HTMLElement {
    constructor() {
        super()
        this.attachShadow({ mode: "open" })
        this.shadowRoot.innerHTML = `
        <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        .floating-action-button {
            position: fixed;
        
            border-radius: 50%;
            background-color: #000;
            color: #fff;
            font-weight: bold;
        
            display: flex;
            justify-content: center;
            align-items: center;
        
            cursor: pointer;
            user-select: none;
        
            z-index: 999;
        }
        
        .floating-action-button.main {
            width: 50px;
            height: 50px;
            font-size: 30px;
        }
        .floating-action-button.sub {
            width: 20px;
            height: 20px;
            font-size: 10px;
            transition: all 0.3s ease-in-out 0s;
            opacity: 0;
            pointer-events: none;
        }
        .floating-action-button.pre-sticky {
            width: 120px;
            height: 60px;
            border-radius: 60px;
            transition: opacity 0.3s ease-in-out;
            opacity: 0;
        
            transform-origin: 90px 30px;
            transform: translate(-30px,0) rotate(0deg);
            z-index: 1;
        }
        
        .active {
            opacity: 1;
            transition: all 0.3s ease-in-out 0s;
        }
        .default {
            opacity: 1;
            transition: all 0.3s ease-in-out 0s;
        }
        .sticky {
            opacity: 0.8;
            transition: all 0.3s ease-in-out 0s;
        }
        .dragging {
            transition: none;
        }
        
        </style>
        <div class="floating-action-button main">
            <div class="floating-action-button icon">+</div>
            <div class="floating-action-button subs">
                <div class="floating-action-button sub">1</div>
                <div class="floating-action-button sub">2</div>
                <div class="floating-action-button sub">3</div>
            </div>
            <div class="floating-action-button pre-sticky"></div>
        </div>
        `
        this.init()
    }
    init() {
        
        if(this.querySelector('div[slot="fab-icon"]')) {
            this.shadowRoot.querySelector('.icon').innerHTML = this.querySelector('div[slot="fab-icon"]').innerHTML
        }
        if(this.querySelector('div[slot="fab-subs"]')) {
            this.shadowRoot.querySelector('.subs').innerHTML = this.querySelector('div[slot="fab-subs"]').innerHTML
            this.shadowRoot.querySelector('.subs').querySelectorAll('div').forEach((item, index) => {
                item.classList.add('floating-action-button', 'sub')
            })
        }

        this.main = this.shadowRoot.querySelector(".main")
        this.subs = this.shadowRoot.querySelector(".subs").children
        this.shadowRoot.querySelector('.subs').querySelectorAll('div').forEach((item) => {
            item.addEventListener("click", (e) => {
                this.dispatchEvent(new CustomEvent("fab-click", { detail: { item } }))
            })
        })
        this.preSticky = this.shadowRoot.querySelector(".pre-sticky")
        this.state = "default"
        this.direction = ""
        this.toggleState = this.toggleState.bind(this)
        this.onStart = this.onStart.bind(this)
        this.onMove = this.onMove.bind(this)
        this.onEnd = this.onEnd.bind(this)
        this.detectEdges = this.detectEdges.bind(this)
        this.threshold = 30
        this.main.addEventListener("mousedown", this.onStart)
        this.main.addEventListener("touchstart", this.onStart)
        this.coordinate = {
            startX: 0,
            startY: 0,
            shiftX: 0,
            shiftY: 0,
            moveX: 0,
            moveY: 0,
            ex: 0,
            ey: 0
        }
    }
    toggleState(toState) {
        this.preSticky.style.opacity = 0
        for(let i = 0; i < this.subs.length; i++) {
            this.subs[i].style.opacity = 0
            this.subs[i].style.pointerEvents = "none"
        }
        switch(toState) {
            case "dragging" :
            this.main.classList = "floating-action-button main dragging"
            this.state = "dragging"
            break
            case "active":
            for (let i = 0; i < this.subs.length; i++) {
                let unit = (2 * Math.PI) / this.subs.length
                let angle = unit * i
                let x = Math.cos(angle) * 40
                let y = Math.sin(angle) * 40
                this.subs[i].style.top = this.main.offsetTop + this.main.clientHeight / 2 - this.subs[i].clientHeight / 2 + "px"
                this.subs[i].style.left = this.main.offsetLeft + this.main.clientWidth / 2 - this.subs[i].clientWidth / 2 + "px"

                this.subs[i].style.opacity = 1
                this.subs[i].style.transform = `translate(${x}px, ${y}px)`
                this.subs[i].style.pointerEvents = "auto"
            }
            this.state = "active"
            break
            case "default":
            this.main.classList = "floating-action-button main default"
            switch(this.direction) {
                case "top":
                this.main.style = `left: ${this.main.offsetLeft  + "px"};top: ${0 + "px"};`
                break
                case "right":
                this.main.style = `left: ${window.innerWidth - this.main.clientWidth + "px"};top: ${this.main.offsetTop  + "px"};`
                break
                case "bottom":
                this.main.style = `left: ${this.main.offsetLeft  + "px"};top: ${window.innerHeight - this.main.clientHeight + "px"};`
                break
                case "left":
                this.main.style = `left: ${0 + "px"};top: ${main.offsetTop  + "px"};`
                break
            }
            for (let i = 0; i < this.subs.length; i++) {
                this.subs[i].style.opacity = 0
                this.subs[i].style.top = this.main.offsetTop + this.main.clientHeight / 2 - this.subs[i].clientHeight / 2 + "px"
                this.subs[i].style.left = this.main.offsetLeft + this.main.clientWidth / 2 - this.subs[i].clientWidth / 2 + "px"
                this.subs[i].style.transform = `translate(0px, 0px)`
            }
            this.state = "default"
            break
            case "sticky":
            this.main.classList = "floating-action-button main sticky"
            switch(this.direction) {
                case "top":
                this.main.style = `left: ${this.main.offsetLeft  + "px"};top: ${0 - this.main.clientHeight / 2 + "px"};`
                break
                case "right":
                this.main.style = `left: ${window.innerWidth - this.main.clientWidth / 2 + "px"};top: ${this.main.offsetTop  + "px"};`
                break
                case "bottom":
                this.main.style = `left: ${this.main.offsetLeft  + "px"};top: ${window.innerHeight - this.main.clientHeight / 2 + "px"};`
                break
                case "left":
                this.main.style = `left: ${0 - this.main.clientWidth / 2 + "px"};top: ${this.main.offsetTop  + "px"};`
                break
            }
            this.state = "sticky"
            case "pre-sticky":
            switch(this.direction) {
                case "top":
                this.preSticky.style = `opacity: 0.5;transform: rotate(90deg) translate(0px, 30px);`
                break
                case "right":
                this.preSticky.style = `opacity: 0.5;transform: rotate(180deg) translate(30px, 0px);`
                break
                case "bottom":
                this.preSticky.style = `opacity: 0.5;transform: rotate(270deg) translate(0px, -30px);`
                break
                case "left":
                this.preSticky.style = `opacity: 0.5;transform: rotate(0deg) translate(-30px, 0px);`
                break
            }
        }
    }

    onStart(e) {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === "mousedown") {
            if (this.state === "default" || this.state === "active") {
            this.startX = e.clientX
            this.startY = e.clientY

            this.shiftX = e.clientX - this.main.getBoundingClientRect().left
            this.shiftY = e.clientY - this.main.getBoundingClientRect().top

            document.addEventListener("mousemove", this.onMove)
            document.addEventListener("mouseup", this.onEnd)
            } else if (this.state === "sticky") {
            this.toggleState("default")
            }
        } else if (e.type === "touchstart") {
            if (this.state === "default" || this.state === "active") {
            this.startX = e.touches[0].clientX
            this.startY = e.touches[0].clientY

            this.shiftX = e.touches[0].clientX - this.main.getBoundingClientRect().left
            this.shiftY = e.touches[0].clientY - this.main.getBoundingClientRect().top

            document.addEventListener("touchmove", this.onMove)
            document.addEventListener("touchend", this.onEnd)
            } else if (this.state === "sticky") {
            this.toggleState("default")
            }
        }
    }
    onMove(e) {
        if (e.type === "mousemove") {
            this.ex = e.clientX
            this.ey = e.clientY
        } else if (e.type === "touchmove") {
            this.ex = e.touches[0].clientX
            this.ey = e.touches[0].clientY
        }
        this.moveX = this.ex - this.startX
        this.moveY = this.ey - this.startY

        if (this.state === "default" || this.state === "active") {
            if (this.moveX * this.moveX + this.moveY * this.moveY > 10) {
            if (this.state === "active") {
                this.toggleState("default")
            }
            this.toggleState("dragging")
            }
        } else if (this.state === "dragging") {
            this.main.style.left = this.ex - this.shiftX + "px"
            this.main.style.top = this.ey - this.shiftY + "px"
            if (this.detectEdges(this.ex, this.ey)) {
            this.toggleState("pre-sticky")
            } else {
            this.toggleState("dragging")
            }
        }
    }

    onEnd(e) {
        if (e.type === "mouseup") {
            document.removeEventListener("mousemove", this.onMove)
            document.removeEventListener("mouseup", this.onEnd)
        } else if (e.type === "touchend") {
            document.removeEventListener("touchmove", this.onMove)
            document.removeEventListener("touchend", this.onEnd)
        }

        switch (this.state) {
            case "dragging":
            if(this.detectEdges(this.ex, this.ey)) this.toggleState("sticky")
            else this.toggleState("default")
            break
            case "default":
            this.toggleState("active")
            break
            default:
            this.toggleState("default")
        }
    }

    detectEdges(ex, ey) {
        let left = ex - this.shiftX
        let top = ey - this.shiftY
        let right = window.innerWidth - left - this.main.clientWidth
        let bottom = window.innerHeight - top - this.main.clientHeight
        if (left < this.threshold) { this.direction = "left"; return true } else 
        if (right < this.threshold) { this.direction = "right"; return true} else 
        if (top < this.threshold) { this.direction = "top"; return true } else 
        if (bottom < this.threshold) { this.direction = "bottom"; return true } 
        else { this.direction = ""; return false }
    }
}

customElements.define("hm-fab", FAB)