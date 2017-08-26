// The vueJS source
// By Olly F-G

var app;
window.onload = function() {
    vm = new Vue({
        el: '#vue',
        data: {
            boardSize: 40, // The board width and height, in em
            state: p4_fen2state(P4_INITIAL_BOARD), // Initialise a board. This can be randomised
        }
    });
}

// The chess board
Vue.component('chess-board', {
    props: ["size", "state"],
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
            highlights: {},
        };
    },
    computed: {
        squareSize: function() {
            return this.size/8;
        },
        board: function() {
            // Make our diplay board from p4wn's board state
            piece_conversions = {
                2: ["pawn", "white"],
                3: ["pawn", "black"],
                4: ["rook", "white"],
                5: ["rook", "black"],
                6: ["knight", "white"],
                7: ["knight", "black"],
                8: ["bishop", "white"],
                9: ["bishop", "black"],
                10: ["king", "white"],
                11: ["king", "black"],
                12: ["queen", "white"],
                13: ["queen", "black"],
            }
            pattern = [];
            var colCount = 0;   // x
            var rowCount = 0;   // y
            for (var i = 0; i < this.state.board.length; i++) {
                if (this.state.board[i] === 16) {
                    // Wall piece :S
                    continue;
                }
                var piece = undefined;
                if (this.state.board[i] !== 0) {
                    piece = {
                        piece: piece_conversions[this.state.board[i]][0],
                        color: piece_conversions[this.state.board[i]][1],
                    }
                }
                pattern.push({
                    i: colCount + rowCount,
                    key: colCount + (rowCount * 8),
                    position: [colCount, rowCount],
                    highlight: this.highlights[[colCount, rowCount]],
                    piece: piece,
                });
                colCount++;
                if (colCount === 8) {
                    rowCount++;
                    colCount = 0;
                }
            }
            return pattern;
        },
    },
    template: `
    <div v-bind:style="style">
        <chess-square
            v-for="square in board"
            v-bind:color="(square.i%2) === 0? 'black': 'white'"
            v-bind:piece="square.piece"
            v-bind:position="square.position"
            v-bind:highlight="square.highlight"
            v-bind:size="squareSize"
            v-bind:hh="getMovesFor"
            v-bind:ch="clearHighlights"
            v-bind:moveTo="movePiece"
            v-bind:key="square.key"
        ></chess-square>
    </div>`,
    methods: {
        movePiece: function (origin, after) {
            // Move a piece, taking anything in the destination space
            // Get the piece
            if (this.pieces[origin[0]] && this.pieces[origin[0]][origin[1]]) {
                var mover = this.pieces[origin[0]][origin[1]];
            } else {
                throw new Error("No piece at position " + origin);
            }
            // See if we are taking anything
            var taken;
            if (this.pieces[after[0]] && this.pieces[after[0]][after[1]]) {
                var taken = this.pieces[after[0]][after[1]];
                console.log("The " + taken.color + " " + taken.piece + " at " + after + " has been taken!");
                // onTake(taken);
            }
            // Check if this is a pawn conversion
            if (mover.piece === "pawn" && (
                (mover.color === "white" && after[1] === 7) ||
                (mover.color === "black" && after[1] === 0)
            )) {
                mover.piece = "queen";
            }
            this.pieces[after[0]][after[1]] = mover;
            this.pieces[origin[0]][origin[1]] = undefined;
            this.clearHighlights();
        },
        getMovesFor: function(origin) {
            var piece = this.pieces[origin[0]][origin[1]];
            var l = origin;
            var moves = []
            switch (piece.piece) {
                case "pawn":
                    if (piece.color === "white") {
                        // Default move
                        if (!this.pieces[l[0]][l[1] + 1]) {
                            moves.push([ l[0], l[1] + 1 ]);
                            // Start boost
                            if (l[1] < 2 && !this.pieces[l[0]][l[1] + 2]) {
                                moves.push([ l[0], l[1] + 2 ]);
                            }
                        }
                        // Diagonal takes
                        if (this.pieces[l[0] + 1][l[1] + 1]) {
                            moves.push([ l[0] + 1, [l[1] + 1 ]]);
                        }
                        if (this.pieces[l[0] - 1][l[1] + 1]) {
                            moves.push([ l[0] - 1, [l[1] + 1 ]]);
                        }
                    } else {
                        // Default move
                        if (!this.pieces[l[0]][l[1] - 1]) {
                            moves.push([ l[0], l[1] - 1 ]);
                            // Start boost
                            if (l[1] > 5 && !this.pieces[l[0]][l[1] - 2]) {
                                moves.push([ l[0], l[1] - 2 ]);
                            }
                        }
                        // Diagonal takes
                        if (this.pieces[l[0] + 1][l[1] - 1]) {
                            moves.push([ l[0] + 1, [l[1] - 1 ]]);
                        }
                        if (this.pieces[l[0] - 1][l[1] - 1]) {
                            moves.push([ l[0] - 1, [l[1] - 1 ]]);
                        }
                    }
                    break;
                case "knight":
                    moves.push([ l[0] - 2, l[1] + 1 ]);
                    moves.push([ l[0] + 2, l[1] + 1 ]);
                    moves.push([ l[0] + 1, l[1] + 2 ]);
                    moves.push([ l[0] - 1, l[1] + 2 ]);
                    moves.push([ l[0] + 2, l[1] - 1 ]);
                    moves.push([ l[0] + 1, l[1] - 2 ]);
                    moves.push([ l[0] - 1, l[1] - 2 ]);
                    moves.push([ l[0] - 2, l[1] - 1 ]);
                    break;
                case "bishop":
                    var deltas = [
                        [1,1],
                        [1,-1],
                        [-1,1],
                        [-1,-1],
                    ];
                    for (var j = 0; j < deltas.length; j++) {
                        var d = deltas[j];
                        for (var i = 1; i < 8; i++) {
                            var x = l[0] + (i * d[0]);
                            var y = l[1] + (i * d[1]);
                            // Break if out of bounds sideways
                            if (!this.pieces[x]) {
                                break;
                            }
                            // If there is a piece here...
                            if (this.pieces[x][y]) {
                                // If it's the same color, don't let us take it
                                if (this.pieces[x][y].color === piece.color) {
                                    break;
                                } else {
                                    moves.push([x, y]);
                                    break;
                                }
                            }
                            moves.push([x, y]);
                        }
                    }
                    break;
                case "queen":
                    var deltas = [
                        [0,1],
                        [0,-1],
                        [1,0],
                        [-1,0],
                        [1,1],
                        [1,-1],
                        [-1,1],
                        [-1,-1],
                    ];
                    for (var j = 0; j < deltas.length; j++) {
                        var d = deltas[j];
                        for (var i = 1; i < 8; i++) {
                            var x = l[0] + (i * d[0]);
                            var y = l[1] + (i * d[1]);
                            // Break if out of bounds sideways
                            if (!this.pieces[x]) {
                                break;
                            }
                            // If there is a piece here...
                            if (this.pieces[x][y]) {
                                // If it's the same color, don't let us take it
                                if (this.pieces[x][y].color === piece.color) {
                                    break;
                                } else {
                                    moves.push([x, y]);
                                    break;
                                }
                            }
                            moves.push([x, y]);
                        }
                    }
                    break;
                case "king":
                    var deltas = [
                        [1,0],
                        [1,1],
                        [1,-1],
                        [0,1],
                        [0,-1],
                        [-1,-1],
                        [-1,1],
                        [-1,0],
                    ]
                    for (var i = 0; i < deltas.length; i++) {
                        var d = deltas[i];
                        var x = l[0] + d[0];
                        var y = l[1] + d[1];
                        if (this.pieces[x] &&
                            this.pieces[x][y] &&
                            this.pieces[x][y].color === piece.color) {
                            continue;
                        }
                        moves.push([x,y]);
                    }
                    break;
                case "rook":
                    var deltas = [
                        [0,1],
                        [0,-1],
                        [1,0],
                        [-1,0],
                    ];
                    for (var j = 0; j < deltas.length; j++) {
                        var d = deltas[j];
                        for (var i = 1; i < 8; i++) {
                            var x = l[0] + (i * d[0]);
                            var y = l[1] + (i * d[1]);
                            // Break if out of bounds sideways
                            if (!this.pieces[x]) {
                                break;
                            }
                            // If there is a piece here...
                            if (this.pieces[x][y]) {
                                // If it's the same color, don't let us take it
                                if (this.pieces[x][y].color === piece.color) {
                                    break;
                                } else {
                                    moves.push([x, y]);
                                    break;
                                }
                            }
                            moves.push([x, y]);
                        }
                    }
                    break;
            }
            var highlights = {};
            for (var i = 0; i < moves.length; i++) {
                highlights[moves[i]] = l;
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
    <div v-bind:style="[style, dynamicStyles]" v-on:click.capture="onClick($event)">
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
        onClick: function (event) {
            if (this.highlight) {
                event.preventDefault();
                event.stopPropagation();
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
                "text-align": "center",
                "line-height": (((this.squareSize * 0.8) / 2) + 1) + "em",
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
                "color": this.color === "black"? "#F2F1D3":"#45403B",
            }
        },
    },
    template: `
    <div
        v-bind:style="[style, reactiveStyles]"
        key="color+piece"
        v-on:click.stop="sendHighlights"
    >
    {{ piece }}
    </div>`,
    methods: {

        sendHighlights: function() {
            if (this.sourceOfHighlights) {
                this.clearHighlights();
                this.sourceOfHighlights = false;
            } else {
                this.sourceOfHighlights = true;
                this.onClick(this.position);
            }
        },
    },
});
