// The vueJS source
// By Olly F-G

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

var vm;
var store;
// Setup our root element
window.onload = function() {
    var initialString = "8/8//8/8/8/8/8/8/ w - - 1 1"
    var p4_state = p4_fen2state(initialString);
    p4_prepare(p4_state);
    store = new Vuex.Store({
        state: {
            inplay: false,
            highlights: {},
            menuType: "welcome",
            graveyard: {
                black: [],
                white: [],
            },
            infoPane: false,
        },
        mutations: {
            setPlaying: function (state, playing) {
                state.inplay = playing;
            },
            clearHighlights: function (state) {
                state.highlights = {};
            },
            updateHighlights: function (state, highlights) {
                for (var key in highlights) {
                    if (highlights.hasOwnProperty(key)) {
                        state.highlights[key] = highlights[key];
                    }
                }
            },
            setMenu: function (state, menuType) {
                state.menuType = menuType;
            },
            exhumateAll: function (state) {
                state.graveyard = {
                    black: [],
                    white: [],
                };
            },
            buryCorpse: function (state, corpse) {
                state.graveyard[corpse.color].push(corpse.piece);
            },
            toggleInfoPage: function (state) {
                state.infoPane = !state.infoPane;
            },
        },
    });
    vm = new Vue({
        el: '#vue',
        store: store,
        data: {
            boardSize: getDimension()[0], // The board width and height, in em
            horizontal: getDimension()[1],
            state: p4_state,
            "player_color": "white",
            difficulty: 0,    // 0 is balanced
        },
        computed: {
            style: function () {
                return {
                    display: "flex",
                    "flex-direction": this.horizontal? "row": "column",
                    "align-items": this.horizontal? "stretch": "center",
                }
            },
            menuType: function () {
                return this.$store.state.menuType;
            },
            showInfoPage: function () {
                return this.$store.state.infoPane;
            },
        },
        methods: {
            newGame: function (color, difficulty) {
                this.difficulty = difficulty || 0;
                this.player_color = color || "white";
                var initialString = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 1 1"
                var p4_state = p4_fen2state(initialString);
                p4_prepare(p4_state);
                this.state = p4_state;
                this.$store.commit("setPlaying", true);
                this.$store.commit("clearHighlights");
                this.$store.commit("setMenu", "none");
                this.$store.commit("exhumateAll");
            },
            pauseMenuClose: function () {
                this.$store.commit("setMenu", "none");
            },
            pauseMenuResign: function () {
                var initialString = "8/8/8/8/8/8/8/8 w - - 1 1"
                var p4_state = p4_fen2state(initialString);
                this.state = p4_state;
                this.$store.commit("setMenu", "welcome");
                this.$store.commit("clearHighlights");
                this.$store.commit("exhumateAll");
            },
            showInfo: function () {
                this.$store.commit("setMenu", "none");
                this.$store.commit("toggleInfoPage");
                return;
            }
        },
        components: {
            "chess-board": chessBoard,
            "title-bar": titleBar,
            "piece-graveyard": graveyard,
            "menu-overlay": menuOverlay,
            "menu-title": menuTitle,
            "menu-item": menuItem,
            "info-pane": infoPane,
        },
    });
}

// The chess piece graveyard
var graveyard = {
    props: ["horizontal", "size"],
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
        pieces: function () {
            return this.$store.state.graveyard;
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
};

// The title bar with menu button
var titleBar = {
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
                cursor: "pointer",
            };
        },
        dynamicItemStyle: function () {
            return {
                padding: (this.size/4) + "em",
            };
        },
    },
    template: `
    <div v-bind:style="[wrapperStyle, dynamicWrapperStyle]">
        <p v-bind:style="[itemStyle, dynamicItemStyle]">Difficulty: {{difficulty}}</p>
        <span class="lightbutton"
            v-bind:style="[itemStyle, , dynamicItemStyle, dynamicMenuStyle]"
            v-on:click="bringUpPauseMenu"
        >Menu</span>
        <slot></slot>
    </div>
    `,
    methods: {
        bringUpPauseMenu: function () {
            if (this.$store.state.inplay) {
                this.$store.commit("setMenu", "pause");
            } else {
                this.$store.commit("setMenu", "welcome");
            }
        },
    },
};

// A title bar for the menu
var menuTitle = {
    props: ["size"],
    computed: {
        style: function () {
            return {
                width: "100%",
                "font-size": this.size + "em",
                "background-color": "#333333",
                padding: "0.5em 0",
                "text-align": "center",
                "margin-bottom": (this.size/2) + "em",
            };
        },
    },
    template: `
    <p v-bind:style="style"><slot></slot></p>
    `,
};

// An item on the menu
var menuItem = {
    props: ["size", "bgcolor", "fontcolor", "onclick"],
    data: function () {
        return {
            sideMargin: 1,
        };
    },
    computed: {
        style: function () {
            return {
                width: "100%",
                "font-size": (this.size/2) + "em",
                "background-color": this.bgcolor? this.bgcolor: "#FFFFFF",
                color: this.fontcolor? this.fontcolor: "#000000",
                padding: "0.5em 0",
                "text-align": "center",
                "margin-top": 0,
                "margin-bottom": 0,
                cursor: "pointer",
            };
        },
        leftMarkerStyle: function () {
            return {
                height: "1em",
                "margin-right": this.sideMargin + "em",
                transition: "margin 0.25s ease",
                "vertical-align": "bottom",
            };
        },
        rightMarkerStyle: function () {
            return {
                height: "1em",
                "margin-left": this.sideMargin + "em",
                transition: "margin 0.25s ease",
                "vertical-align": "bottom",
            };
        },
    },
    template: `
    <p
        v-bind:style="style"
        v-on:mouseover="setSideMargin(1.5)"
        v-on:mouseout="setSideMargin(1)"
        v-on:click.stop="onClick"
    >
        <img src="img/white_pawn.svg" v-bind:style="leftMarkerStyle">
        <slot></slot>
        <img src="img/white_pawn.svg" v-bind:style="rightMarkerStyle">
    </p>
    `,
    methods: {
        setSideMargin: function (newMargin) {
            this.sideMargin = newMargin;
        },
        onClick: function () {
            this.onclick();
        }
    },
};

// The pause menu
var menuOverlay = {
    props: ["horizontal", "size"],
    computed: {
        guardStyle: function () {
            var style = {
                display: "flex",
                "flex-direction": "column",
                "justify-content": "space-around",
                "align-items": "stretch",
                "background-color": "#33333388",
                position: "absolute",
                top: 0,
                color: "#FFFFFF",
                width: "100%",
                height: "100%",
            };
            return style
        },
    },
    template: `
    <div v-bind:style="guardStyle">
        <slot></slot>
    </div>
    `,
};

// A chess piece
var chessPiece = {
    props: ["color", "piece", "squareSize", "position", "onClick", "clickable"],
    data: function() {
        return {
            style: {
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
                cursor: this.clickable? "pointer": "default",
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
            if (this.clickable) {
                if (this.sourceOfHighlights) {
                    this.$store.commit("clearHighlights");
                    this.sourceOfHighlights = false;
                } else {
                    this.sourceOfHighlights = true;
                    this.onClick(this.position);
                }
            }
        },
    },
};

// A chess square
var chessSquare = {
    props: ["color", "size", "highlight", "moveTo", "position"],
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
        <slot></slot>
    </div>`,
    methods: {
        onClick: function (event) {
            if (this.highlight && this.highlight !== "danger") {
                event.preventDefault();
                event.stopPropagation();
                this.moveTo(this.highlight, this.position);
            } else {
                this.$store.commit("clearHighlights");
            }
        },
    },
};

// The chess board
var chessBoard = {
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
        dynamicStyle: function () {
            return {
                width: (this.size * 8) + "em",
                width: (this.size * 8) + "em",
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
                    highlight: this.$store.state.highlights[[colCount, rowCount]],
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
    <div v-bind:style="[style, dynamicStyle]" ref="board">
        <chess-square
            v-for="square in board"
            v-bind:color="(square.i%2) === 0? 'black': 'white'"
            v-bind:position="square.position"
            v-bind:highlight="square.highlight"
            v-bind:size="size"
            v-bind:moveTo="movePiece"
            v-bind:key="square.key"
        >
            <chess-piece
                v-if="square.piece"
                v-bind:color="square.piece.color"
                v-bind:piece="square.piece.piece"
                v-bind:position="square.position"
                v-bind:squareSize="size"
                v-bind:onClick="getMovesFor"
                v-bind:clickable="pieceIsClickable(square.piece.color)"
            ></chess-piece>
        </chess-square>
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
            this.$store.commit("clearHighlights");
            if (!result.ok) {
                return;
            }
            if (result.flags & P4_MOVE_FLAG_MATE) {
                var king = this.state.pieces[this.state.to_play].filter(function (piece) {
                    return piece[0] === 10 || piece[0] === 11;
                })[0];
                var h = {};
                h[this.boardIndexToCoords(king[1])] = "danger";
                this.$store.commit("updateHighlights", h);
                this.$store.commit("setPlaying", false);
                alert("Checkmate!")
            } else if (result.flags & P4_MOVE_FLAG_CHECK) {
                // Find the king, and highlight him
                var king = this.state.pieces[this.state.to_play].filter(function (piece) {
                    return piece[0] === 10 || piece[0] === 11;
                })[0];
                var h = {};
                h[this.boardIndexToCoords(king[1])] = "danger";
                this.$store.commit("updateHighlights", h);
            } else if (result.flags & P4_MOVE_FLAG_CAPTURE) {
                var piece = this.p4_conversions[potential_capture];
                this.$store.commit("buryCorpse", piece);
            }
            if (this.state.to_play !== (this.player_color === "black"? 1:0)) {
                // Let the computer have a go
                this.doComputerTurn();
            } else {
                // Highlight the computer's turn
                var h = {};
                h[this.boardIndexToCoords(afterIndex)] = "prev_move";
                h[this.boardIndexToCoords(originIndex)] = "prev_move";
                this.$store.commit("updateHighlights", h);
            }
        },
        doComputerTurn: function () {
            var computerMove = this.state.findmove(2);  // Shall we make this adjustable?
            this.movePiece(undefined, undefined, computerMove);
        },
        getMovesFor: function(origin) {
            this.$store.commit("clearHighlights");
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
            this.$store.commit("updateHighlights", highlights);
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
        pieceIsClickable: function (piece_color) {
            return this.$store.state.inplay && (piece_color === this.player_color)
        },
    },
    components: {
        "chess-square": chessSquare,
        "chess-piece": chessPiece,
    },
};

// The info pane
var infoPane = {
    props: ["horizontal", "size"],
    data: function () {
        return {
            guardStyle: {
                display: "flex",
                "flex-direction": "column",
                "justify-content": "flex-start",
                "align-items": "center",
                "background-color": "#33333388",
                position: "absolute",
                top: 0,
                width: "100%",
                height: "100%",
            },
            pageStyle: {
                "background-color": "#FFFFFF",
                "flex-grow": 1,
                "overflow-y": "auto",
                "max-width": (this.size * 8) + "em",
                padding: "1em",
            }
        };
    },
    template: `
    <div v-bind:style="guardStyle" v-on:click="hideInfo">
        <div
            v-bind:style="pageStyle"
            v-once
        >
            <h1>How Do I Play?</h1>
            <p>Simply go back to the main menu (hit the "back" button below), choose your level of difficulty, which color you would like to play as, and press "New Game".</p>
            <p>You will be presented with a fairly familiar board!</p>
            <p>To make a move, press on the piece you have chosen to move, and the possible moves will be highlighted. Press on one of the highlights to make the move.</p>
            <p>You can pause or quit the game at any time using the menu button found to the top-right of the board.</p>

            <h1>What Does Difficulty Really Mean?</h1>
            <p>In this game, difficulty does <em>not</em> change the intelligence of the computer player.</p>
            <p>Instead it selects how much better one team will be than the other. A difficulty of 0 is fairly even - you might get unusual pieces in unusual places, but the opponent will have simmilar strength pieces.</p>
            <p>Setting difficulty to a negative number will make your pieces better, and the opponent's worse, while a positive number will do the opposite.</p>

            <h1>Credits</h1>
            <p>This app was created by <a href="http://www.ollyfg.com">Oliver Fawcett-Griffiths</a>, a software developer from New Zealand.</p>

            <p>It was created using <a href="https://vuejs.org/">vueJS</a>, and is backed by the wonderful <a href="http://p4wn.sourceforge.net/">P4WN</a> Javascript chess engine.</p>

            <p>The idea was taken from Zach Gage's <a href="http://reallybadchess.com/">Really Bad Chess</a>. Really Bad Chess is a great game, however it is encumbered by advertising and is non-free software.</p>

            <p>This app is free and open source under the XXX Licence, and the source can be found on <a href="">GitLab</a> or <a href="">GitHub</a>.</p>
        </div>
        <menu-item
            v-bind:size="this.size"
            v-bind:onclick="hideInfo"
            bgcolor="#BD2727"
            fontcolor="#F1F1F1"
        >
            Back
        </menu-item>
    </div>
    `,
    methods: {
        hideInfo: function () {
            this.$store.commit("toggleInfoPage");
            this.$store.commit("setMenu", "welcome");
        },
    },
    components: {
        "menu-item": menuItem,
    },
};
