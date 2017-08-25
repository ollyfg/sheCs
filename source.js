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
            }
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
                    var piece = {
                        piece: "none",
                        color: "none",
                    };
                    if (this.pieces[j] && this.pieces[j][i]) {
                        piece = this.pieces[j][i];
                    }
                    pattern.push({
                        i: i + j,
                        position: [j, i],
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
            v-bind:size="squareSize"
            v-bind:key="square.i"
        >
        </chess-square>
    </div>`,
    methods: {
        movePiece: function (origin, after) {
            // Move a piece, taking anything in the destination space
            if (this.pieces[origin[0]] && this.pieces[origin[0]][origin[1]]) {
                console.log("Moving the piece at " + origin + " to " + after);
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
            this.pieces[after[0]][after[1]] = mover;
            this.pieces[origin[0]][origin[1]] = undefined;
        },
    },
});

// A chess square - locally bound to chess-board
Vue.component('chess-square',  {
    props: ["color", "size", "position", "piece"],
    data: function() {
        return {
            style: {
                width: this.size + "em",
                height: this.size + "em",
                "background-color": this.color === "black"? "#BB9C7C": "#FFFFFF",
                display: "flex",
                "justify-content": "center",
                "align-items": "center",
            }
        }
    },
    template: `
    <div v-bind:style="style">
        <chess-piece
            v-if="piece"
            v-bind:color="piece.color"
            v-bind:piece="piece.piece"
            v-bind:position="position"
            v-bind:squareSize="size"
        >
        </chess-piece>
    </div>`,
});

// A chess piece
Vue.component('chess-piece',  {
    props: ["color", "piece", "squareSize"],
    data: function() {
        return {
            style: {
                width: (this.squareSize * 0.8) + "em",
                height: (this.squareSize * 0.8) + "em",
                "border-radius": "50%",
                "border": "3px solid #000000",
            }
        }
    },
    computed: {
        show: function() {
            return !(this.color === "none" && this.piece === "none");
        },
        reactiveStyles: function() {
            return {
                "background-color": this.color === "black"? "#45403B":"#F2F1D3",
            }
        },
    },
    template: '<div v-bind:style="[style, reactiveStyles]" key="color+piece" v-if="show">{{color}}</div>',
});
