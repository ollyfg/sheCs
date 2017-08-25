// The vueJS source
// By Olly F-G

var app;
window.onload = function() {
    vm = new Vue({
        el: '#vue',
        data: {
            boardSize: 40, // The board width and height, in em
        }
    });
}

// The chess board
Vue.component('chess-board', {
    props: ["size"],
    data: function() {
        return {
            "style": {
                display: "flex",
                "flex-wrap": "wrap",
                width: this.size + "em",
                width: this.size + "em",
                border: (this.size * 0.05) + "em solid #E29D36",
                "border-radius": "2.5%",
            },
            pieces: {
                0: {
                    0: {
                        piece: "knight",
                        color: "black",
                    },
                },
                1: {
                    1: {
                        piece: "bishop",
                        color: "white",
                    },
                },
            },
            highlights: {},
        }
    },
    computed: {
        squareSize: function() {
            return this.size/8;
        },
        generateBoard: function() {
            pattern = [];
            for (var i = 0; i < 8; i++) {
                for (var j = 0; j < 8; j++) {
                    var piece = undefined;
                    if (this.pieces[j] && this.pieces[j][i]) {
                        piece = this.pieces[j][i];
                    }
                    pattern.push({
                        i: i + j,
                        key: (i * j) + j,
                        position: [j, i],
                        highlight: this.highlights[[j, i]],
                        piece: piece,
                    });
                }
            }
            return pattern;
        },
    },
    template: `
    <div v-bind:style="style">
        <chess-square
            v-for="square in generateBoard"
            v-bind:color="(square.i%2) === 0? 'black': 'white'"
            v-bind:piece="square.piece"
            v-bind:position="square.position"
            v-bind:highlight="square.highlight"
            v-bind:size="squareSize"
            v-bind:hh="handleHighlights"
            v-bind:ch="clearHighlights"
            v-bind:moveTo="movePiece"
            v-bind:key="square.key"
        ></chess-square>
    </div>`,
    methods: {
        movePiece: function (origin, after) {
            // Move a piece, taking anything in the destination space
            if (this.pieces[origin[0]] && this.pieces[origin[0]][origin[1]]) {
                var mover = this.pieces[origin[0]][origin[1]];
            } else {
                throw new Error("No piece at position " + origin);
            }
            var taken;
            if (this.pieces[after[0]] && this.pieces[after[0]][after[1]]) {
                console.log("The piece at " + after + " has been taken!");
                var taken = this.pieces[after[0]][after[1]];
                // onTake(taken);
            }
            if (!this.pieces[after[0]]) {
                this.pieces[after[0]] = {};
            }
            this.pieces[after[0]][after[1]] = mover;
            this.pieces[origin[0]][origin[1]] = undefined;
            this.clearHighlights();
        },
        handleHighlights: function (origin, coords) {
            var highlights = {};
            for (var i = 0; i < coords.length; i++) {
                highlights[coords[i]] = origin;
            }
            this.highlights = highlights;
        },
        clearHighlights: function () {
            this.highlights = {};
        },
    },
});

// A chess square
Vue.component('chess-square',  {
    props: ["color", "size", "position", "piece", "hh", "ch", "highlight", "moveTo"],
    data: function() {
        return {
            style: {
                width: this.size + "em",
                height: this.size + "em",
                display: "flex",
                "justify-content": "center",
                "align-items": "center",
            }
        }
    },
    computed: {
        dynamicStyles: function () {
            var background;
            var cursor = "default"
            if (this.highlight) {
                background = "#FF7777";
                cursor = "pointer";
            } else if (this.color === "black") {
                background = "#BB9C7C";
            } else {
                background = "#F2F1D3";
            }
            return {
                "background-color": background,
                "cursor": cursor,
            };
        }
    },
    template: `
    <div v-bind:style="[style, dynamicStyles]" v-on:click.capture="onClick">
        <chess-piece
            v-if="piece"
            v-bind:color="piece.color"
            v-bind:piece="piece.piece"
            v-bind:position="position"
            v-bind:squareSize="size"
            v-bind:onClick="hh"
            v-bind:clearHighlights="ch"
        ></chess-piece>
    </div>`,
    methods: {
        onClick: function () {
            if (this.highlight) {
                this.moveTo(this.highlight, this.position);
            } else {
                this.ch();
            }
        },
    },
});

// A chess piece
Vue.component('chess-piece',  {
    props: ["color", "piece", "squareSize", "position", "onClick", "clearHighlights"],
    data: function() {
        return {
            style: {
                width: (this.squareSize * 0.8) + "em",
                height: (this.squareSize * 0.8) + "em",
                "border-radius": "50%",
                "border": "3px solid #000000",
                "cursor": "pointer",
            },
            sourceOfHighlights: false,
        }
    },
    computed: {
        reactiveStyles: function() {
            return {
                "background-color": this.color === "black"? "#45403B":"#F2F1D3",
            }
        },
    },
    template: `
    <div
        v-bind:style="[style, reactiveStyles]"
        key="color+piece"
        v-on:click.stop="sendHighlights"
    ></div>`,
    methods: {
        getMoves: function() {
            var l = this.position;
            var moves = []
            switch (this.piece) {
                case "pawn":
                    return moves;
                case "knight":
                    moves.push([l[0] + 2, l[1] + 1])
                    moves.push([l[0] + 1, l[1] + 2])
                    moves.push([l[0] - 2, l[1] + 1])
                    moves.push([l[0] - 1, l[1] + 2])
                    moves.push([l[0] + 2, l[1] - 1])
                    moves.push([l[0] + 1, l[1] - 2])
                    moves.push([l[0] - 1, l[1] - 2])
                    moves.push([l[0] - 2, l[1] - 1])
                    return moves;
                case "bishop":
                    return moves;
                case "queen":
                    return moves;
                case "king":
                    return moves;
                case "rook":
                    return moves;
            }
        },
        sendHighlights: function() {
            if (this.sourceOfHighlights) {
                this.clearHighlights();
                this.sourceOfHighlights = false;
            } else {
                this.sourceOfHighlights = true;
                var squares = this.getMoves();
                this.onClick(this.position, squares);
            }
        },
    },
});
