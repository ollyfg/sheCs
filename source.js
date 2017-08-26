// The vueJS source
// By Olly F-G

var app;
window.onload = function() {
    vm = new Vue({
        el: '#vue',
        data: {
            boardSize: 40, // The board width and height, in em
            state: p4_fen2state(P4_INITIAL_BOARD), // Initialise a board. This can be randomised
            "player_color": "white",
        }
    });
}

// The chess board
Vue.component('chess-board', {
    props: ["size", "state", "player_color"],
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
            p4_conversions: {
                2: { piece: "pawn", color: "white", },
                3: { piece: "pawn", color: "black", },
                4: { piece: "rook", color: "white", },
                5: { piece: "rook", color: "black", },
                6: { piece: "knight", color: "white", },
                7: { piece: "knight", color: "black", },
                8: { piece: "bishop", color: "white", },
                9: { piece: "bishop", color: "black", },
                10: { piece: "king", color: "white", },
                11: { piece: "king", color: "black", },
                12: { piece: "queen", color: "white", },
                13: { piece: "queen", color: "black", },
            }
        };
    },
    computed: {
        squareSize: function() {
            return this.size/8;
        },
        board: function() {
            // Make our diplay board from p4wn's board state
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
                    piece = this.p4_conversions[this.state.board[i]];
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
        movePiece: function (origin, after, start_end) {
            // Move a piece
            if (start_end) {
                // Already in P4WN notation - probably the computer's move
                var originIndex = start_end[0];
                var afterIndex = start_end[1];
            } else {
                // In visible notation, needs converting
                originIndex = this.coordsToBoardIndex(origin);
                afterIndex = this.coordsToBoardIndex(after);
            }
            var result = this.state.move(originIndex, afterIndex);
            if (result.flags & P4_MOVE_FLAG_MATE) {
                console.log("Checkmate!")
            } else if (result.flags & P4_MOVE_FLAG_CHECK) {
                console.log("Check!")
            } else if (result.flags & P4_MOVE_FLAG_CAPTURE) {
                console.log("Capture!")
            }
            this.clearHighlights();
            if (this.state.to_play !== (this.player_color === "black"? 1:0)) {
                this.doComputerTurn();
            }
        },
        doComputerTurn: function () {
            var computerMove = this.state.findmove(4);  // Shall we make this adjustable?
            this.movePiece(undefined, undefined, computerMove);
        },
        getMovesFor: function(origin) {
            var piece = this.pieceAt(origin);
            var l = origin;
            var moves = [];
            // Check it's the color's turn
            if (this.state.to_play !== (this.player_color === "black"? 1:0) ) {
                return;
            }
            // Check that the moved piece is the right color
            if (piece.color !== this.player_color) {
                return;
            }
            switch (piece.piece) {
                case "pawn":
                    if (piece.color === "white") {
                        // Default move
                        if (!this.pieceAt([ l[0], l[1] + 1 ])) {
                            moves.push([ l[0], l[1] + 1 ]);
                            // Start boost
                            if (l[1] < 2 && !this.pieceAt([ l[0], l[1] + 2 ])) {
                                moves.push([ l[0], l[1] + 2 ]);
                            }
                        }
                        // Diagonal takes
                        if (this.pieceAt([ l[0] + 1, l[1] + 1 ])) {
                            moves.push([ l[0] + 1, l[1] + 1 ]);
                        }
                        if (this.pieceAt([ l[0] - 1, l[1] + 1 ])) {
                            moves.push([ l[0] - 1, l[1] + 1 ]);
                        }
                    } else {
                        // Default move
                        if (!this.pieceAt([ l[0], l[1] - 1 ])) {
                            moves.push([ l[0], l[1] - 1 ]);
                            // Start boost
                            if (l[1] > 5 && !this.pieceAt([ l[0], l[1] - 2 ])) {
                                moves.push([ l[0], l[1] - 2 ]);
                            }
                        }
                        // Diagonal takes
                        if (this.pieceAt([ l[0] + 1, l[1] - 1 ])) {
                            moves.push([ l[0] + 1, l[1] - 1 ]);
                        }
                        if (this.pieceAt([ l[0] - 1, l[1] - 1 ])) {
                            moves.push([ l[0] - 1, l[1] - 1 ]);
                        }
                    }
                    break;
                case "knight":
                    var possible_moves = [
                        [ l[0] - 2, l[1] + 1 ],
                        [ l[0] + 2, l[1] + 1 ],
                        [ l[0] + 1, l[1] + 2 ],
                        [ l[0] - 1, l[1] + 2 ],
                        [ l[0] + 2, l[1] - 1 ],
                        [ l[0] + 1, l[1] - 2 ],
                        [ l[0] - 1, l[1] - 2 ],
                        [ l[0] - 2, l[1] - 1 ],
                    ];
                    for (var i = 0; i < possible_moves.length; i++) {
                        var m = possible_moves[i];
                        if (this.pieceAt([ m[0], m[1] ]) && this.pieceAt([ m[0], m[1] ]).color === piece.color) {
                            continue;
                        }
                        moves.push(m)
                    }
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
                            // If there is a piece here...
                            if (this.pieceAt([x,y])) {
                                // If it's the same color, don't let us take it
                                if (this.pieceAt([x,y]).color === piece.color) {
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
                            // If there is a piece here...
                            if (this.pieceAt([x,y])) {
                                // If it's the same color, don't let us take it
                                if (this.pieceAt([x,y]).color === piece.color) {
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
                        if (this.pieceAt([x,y]) &&
                            this.pieceAt([x,y]).color === piece.color) {
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
                            // If there is a piece here...
                            if (this.pieceAt([x,y])) {
                                // If it's the same color, don't let us take it
                                if (this.pieceAt([x,y]).color === piece.color) {
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
        coordsToBoardIndex: function (coords) {
            var bigCoords = this.coordsToBigBoard(coords);
            return bigCoords[0] + (bigCoords[1] * 10);
        },
        coordsToBigBoard: function (coords) {
            return [coords[0] + 1, coords[1] + 2];
        },
        pieceAt: function (coords) {
            return this.p4_conversions[
                this.state.board[
                    this.coordsToBoardIndex(
                        coords
                    )
                ]
            ];
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
