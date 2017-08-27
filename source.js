// The vueJS source
// By Olly F-G

var vm;
window.onload = function() {
    var initialString = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 1 1"
    var p4_state = p4_fen2state(initialString);
    p4_prepare(p4_state);
    vm = new Vue({
        el: '#vue',
        data: {
            boardSize: getDimension()[0], // The board width and height, in em
            horizontal: getDimension()[1],
            state: p4_state,
            "player_color": "white",
            difficulty: 0,    // 0 is balanced
            graveyard: {
                black: [],
                white: [],
            },
        },
        computed: {
            style: function () {
                return {
                    display: "flex",
                    "flex-direction": this.horizontal? "row": "column",
                    "align-items": this.horizontal? "stretch": "center",
                }
            }
        },
    });
}
window.onresize = function () {
    vm.boardSize = getDimension()[0];
    vm.horizontal = getDimension()[1];
}

// Get the best dimension to max the board size
// The second return value is true if the view is horizontal
function getDimension() {
    var emWidth = document.querySelector("#em").clientWidth;
    var bodyWidth = document.body.clientWidth;
    var bodyHeight = document.body.clientHeight;
    var dimension = Math.min(bodyWidth, bodyHeight);
    return [Math.floor(dimension / emWidth), bodyWidth > bodyHeight];
}

// The title bar with menu button
Vue.component('title-bar', {
    props: ["difficulty", "horizontal", "graveyard", "size"],
    data: function () {
        return {
            wrapperStyle: {
                display: "flex",
            },
            itemStyle: {
                margin: 0,
                order: 1,
            },
        };
    },
    computed: {
        dynamicWrapperStyle: function () {
            if (this.horizontal) {
                return {
                    order: 1,
                    "flex-direction": "column",
                    "align-items": "flex-start",
                    "justify-content": "flex-start",
                };
            } else {
                return {
                    order: 0,
                    "flex-direction": "row",
                    "align-items": "center",
                    "justify-content": "space-around",
                };
            }
        },
        dynamicMenuStyle: function () {
            return {
                order: this.horizontal? 0: 1,
            };
        },
        dynamicItemStyle: function () {
            return {
                padding: (this.size/32) + "em",
            };
        },
    },
    template: `
    <div v-bind:style="[wrapperStyle, dynamicWrapperStyle]">
        <p v-bind:style="[itemStyle, dynamicItemStyle]">Difficulty: {{difficulty}}</p>
        <a v-bind:style="[itemStyle, , dynamicItemStyle, dynamicMenuStyle]">Menu</a>
        <piece-graveyard
            v-if="horizontal"
            v-bind:horizontal="horizontal"
            v-bind:pieces="graveyard"
            v-bind:size="size/8"
        ></piece-graveyard>
    </div>
    `,
});

// The chess piece graveyard
Vue.component('piece-graveyard', {
    props: ["horizontal", "pieces", "size"],
    data: function () {
        return {
            style: {
                display: "flex",
                order: 3,
                "flex-wrap": "wrap",
                "flex-grow": 1,
            },
            rowStyle: {
                display: "flex",
                "flex-direction": "row",
            },
        };
    },
    computed: {
        dynamicStyle: function () {
            if (this.horizontal) {
                return {
                    "flex-direction": "column",
                    "margin-left": (this.size * 0.25) + "em",
                    "justify-content": "center",
                };
            } else {
                return {
                    "flex-direction": "row",
                    "margin-top": (this.size * 0.25) + "em",
                    width: (this.size * 8) + "em",
                    "justify-content": "space-between",
                };
            }
        },
        imageStyle: function () {
            return {
                width: (this.size * 0.75) + "em",
            };
        },
    },
    template: `
    <div
        v-bind:style="[style, dynamicStyle]"
    >
        <div
            v-bind:style="rowStyle"
            v-for="(colored_pieces, color) in pieces"
        >
            <img
                v-for="piece in colored_pieces"
                v-bind:src="'img/'+color+'_'+piece+'.svg'"
                v-bind:style="imageStyle"
            >
        </div>
    </div>
    `,
});

// The chess board
Vue.component('chess-board', {
    props: ["size", "state", "player_color", "graveyard"],
    data: function() {
        return {
            "style": {
                display: "flex",
                "flex-wrap": "wrap",
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
        squareSize: function () {
            return this.size/8;
        },
        dynamicStyle: function () {
            return {
                width: this.size + "em",
                width: this.size + "em",
            };
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
    <div v-bind:style="[style, dynamicStyle]">
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
            var potential_capture = this.state.board[afterIndex];
            var result = this.state.move(originIndex, afterIndex);
            this.clearHighlights();
            if (!result.ok) {
                return;
            }
            if (result.flags & P4_MOVE_FLAG_MATE) {
                var king = this.state.pieces[this.state.to_play].filter(function (piece) {
                    return piece[0] === 10 || piece[0] === 11;
                })[0];
                var h = this.highlights;
                h[this.boardIndexToCoords(king[1])] = "danger";
                this.highlights = h;
                alert("Checkmate!")
            } else if (result.flags & P4_MOVE_FLAG_CHECK) {
                // Find the king, and highlight him
                var king = this.state.pieces[this.state.to_play].filter(function (piece) {
                    return piece[0] === 10 || piece[0] === 11;
                })[0];
                var h = this.highlights;
                h[this.boardIndexToCoords(king[1])] = "danger";
                this.highlights = h;
            } else if (result.flags & P4_MOVE_FLAG_CAPTURE) {
                var piece = this.p4_conversions[potential_capture];
                this.graveyard[piece.color].push(piece.piece);
            }
            if (this.state.to_play !== (this.player_color === "black"? 1:0)) {
                // Let the computer have a go
                this.doComputerTurn();
            } else {
                // Highlight the computer's turn
                var h = this.highlights;
                h[this.boardIndexToCoords(afterIndex)] = "prev_move";
                h[this.boardIndexToCoords(originIndex)] = "prev_move";
                this.highlights = h;
            }
        },
        doComputerTurn: function () {
            var computerMove = this.state.findmove(2);  // Shall we make this adjustable?
            this.movePiece(undefined, undefined, computerMove);
        },
        getMovesFor: function(origin) {
            var piece = this.pieceAt(origin);
            var l = origin;
            var boardIndex = this.coordsToBoardIndex(origin);
            var moves = [];
            // Check it's the color's turn
            if (this.state.to_play !== (this.player_color === "black"? 1:0) ) {
                return;
            }
            // Check that the moved piece is the right color
            if (piece.color !== this.player_color) {
                return;
            }
            var boardIndexToCoords = this.boardIndexToCoords;
            var state = this.state;
            var moves = p4_parse(this.state, this.state.to_play, 0, 0)
            .filter(function (move) {
                // Only moves for this piece
                return move[1] === boardIndex;
            }).filter(function (move) {
                // Filter out king moving into check
                if (piece.piece === "king") {
                    var legal = true;
                    var m = p4_make_move(state, move[1], move[2], "queen");
                    legal = !p4_check_check(state, (piece.color==="black"?1:0));
                    p4_unmake_move(state, m);
                    return legal;
                } else {
                    return true;
                }
            }).map(function (move) {
                // Return a pair of our board coords
                return boardIndexToCoords(move[2]);
            });
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
        boardIndexToCoords: function (index) {
            var x = (index % 10) - 1;
            var y = parseInt( index / 10 ) - 2;
            return [x, y];
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
Vue.component('chess-square', {
    props: ["color", "size", "position", "piece", "hh", "ch", "highlight", "moveTo"],
    data: function() {
        return {
            style: {
                display: "flex",
                "justify-content": "center",
                "align-items": "center",
                "user-select": "none",
            }
        }
    },
    computed: {
        dynamicClasses: function () {
            var classes = ["square", this.color];
            if (this.highlight) {
                if (this.highlight === "danger") {
                    classes.push("danger");
                } else if (this.highlight === "prev_move") {
                    classes.push("prev_move");
                } else {
                    classes.push("highlighted");
                }
            }
            return classes;
        },
        dynamicStyle: function () {
            return {
                width: this.size + "em",
                height: this.size + "em",
            };
        },
    },
    template: `
    <div
        v-bind:style="[style, dynamicStyle]"
        v-on:click.capture="onClick($event)"
        v-bind:class="dynamicClasses"
    >
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
            if (this.highlight && this.highlight !== "danger") {
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
Vue.component('chess-piece', {
    props: ["color", "piece", "squareSize", "position", "onClick", "clearHighlights"],
    data: function() {
        return {
            style: {
                cursor: "pointer",
                "user-select": "none",

            },
            sourceOfHighlights: false,
        }
    },
    computed: {
        imageSrc: function () {
            return "img/" + this.color + "_" + this.piece + ".svg";
        },
        dynamicStyle: function () {
            return {
                height: (this.squareSize * 0.8) + "em",
            };
        },
    },
    template: `
    <img
        v-bind:style="[style, dynamicStyle]"
        key="color+piece"
        v-on:click.stop="sendHighlights"
        v-bind:src="imageSrc"
    >
    `,
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
