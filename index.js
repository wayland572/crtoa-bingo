var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var _a;
var Field = /** @class */ (function () {
    function Field(size) {
        if (size === void 0) { size = 5; }
        this.size = size;
        this.rows = [];
        this.columns = [];
        this.diagonals = [new Line(), new Line()];
        this.cells = [];
        for (var i = 0; i < size; i++) {
            var row = new Line();
            this.rows.push(row);
            for (var j = 0; j < size; j++) {
                if (i === 0) {
                    this.columns.push(new Line());
                }
                var column = this.columns[j];
                var cell = new Cell(i * size + j + 1, this, row, column);
                row.cells.push(cell);
                column.cells.push(cell);
                this.cells.push(cell);
                if (i === j) {
                    this.diagonals[0].cells.push(cell);
                    cell.lines.push(this.diagonals[0]);
                    cell.diagonals.push(this.diagonals[0]);
                }
                if (i + j + 1 === size) {
                    this.diagonals[1].cells.push(cell);
                    cell.lines.push(this.diagonals[1]);
                    cell.diagonals.push(this.diagonals[1]);
                }
            }
        }
        this.lines = __spreadArray(__spreadArray(__spreadArray([], this.columns, true), this.rows, true), this.diagonals, true);
    }
    Object.defineProperty(Field.prototype, "linesCompleted", {
        get: function () {
            var count = 0;
            for (var i = 0; i < this.lines.length; i++) {
                if (this.lines[i].isComplete) {
                    count++;
                }
            }
            return count;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Field.prototype, "hasRedundantCells", {
        // a cell is redundant if it does not complete any line
        get: function () {
            outer: for (var _i = 0, _a = this.cells; _i < _a.length; _i++) {
                var cell = _a[_i];
                if (!cell.used) {
                    continue;
                }
                for (var _b = 0, _c = cell.lines; _b < _c.length; _b++) {
                    var line = _c[_b];
                    if (line.isComplete) {
                        continue outer;
                    }
                }
                return true;
            }
            return false;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Field.prototype, "usedCellCount", {
        get: function () {
            var count = 0;
            for (var _i = 0, _a = this.cells; _i < _a.length; _i++) {
                var cell = _a[_i];
                if (cell.used) {
                    count++;
                }
            }
            return count;
        },
        enumerable: false,
        configurable: true
    });
    Field.prototype.reset = function () {
        for (var _i = 0, _a = this.cells; _i < _a.length; _i++) {
            var cell = _a[_i];
            cell.used = false;
        }
    };
    Field.prototype.finishable = function (targetPattern, maxMoves) {
        var movesNeeded = 0;
        for (var i = 0; i < this.cells.length; i++) {
            if (targetPattern.cells[i].used && !this.cells[i].used) {
                movesNeeded++;
                if (movesNeeded > maxMoves) {
                    return false;
                }
            }
        }
        return true;
    };
    Field.prototype.clone = function () {
        var clone = new Field(this.size);
        for (var i = 0; i < this.cells.length; i++) {
            clone.cells[i].used = this.cells[i].used;
        }
        return clone;
    };
    Field.prototype.print = function () {
        for (var _i = 0, _a = this.rows; _i < _a.length; _i++) {
            var row = _a[_i];
            var output = '';
            for (var _b = 0, _c = row.cells; _b < _c.length; _b++) {
                var cell = _c[_b];
                output += cell.used ? 'x ' : 'o ';
            }
            console.log(output);
        }
    };
    return Field;
}());
var Line = /** @class */ (function () {
    function Line() {
        this.cells = [];
    }
    Object.defineProperty(Line.prototype, "isComplete", {
        get: function () {
            for (var i = 0; i < this.cells.length; i++) {
                if (!this.cells[i].used) {
                    return false;
                }
            }
            return true;
        },
        enumerable: false,
        configurable: true
    });
    return Line;
}());
var Cell = /** @class */ (function () {
    function Cell(id, field, row, column) {
        this.id = id;
        this.field = field;
        this.row = row;
        this.column = column;
        this.used = false;
        this.lines = [];
        this.diagonals = [];
        this.lines.push(row, column);
    }
    Cell.prototype.getLineCompletionDesc = function () {
        var counts = [];
        for (var _i = 0, _a = this.lines; _i < _a.length; _i++) {
            var line = _a[_i];
            var lineCount = 0;
            for (var _b = 0, _c = line.cells; _b < _c.length; _b++) {
                var cell = _c[_b];
                if (cell.used) {
                    lineCount++;
                }
            }
            counts.push(lineCount);
        }
        return counts.sort(function (a, b) { return b - a; });
    };
    Cell.prototype.use = function () {
        if (this.used) {
            throw new Error('Cell already used.');
        }
        this.used = true;
    };
    return Cell;
}());
function getRandomFreeCell(cells) {
    var freeCells = cells.filter(function (cell) { return !cell.used; });
    if (freeCells.length === 0) {
        return null;
    }
    return freeCells[Math.floor(Math.random() * freeCells.length)];
}
// returns unused cell which has the most complete lines
function getMostCompleteCell(cells) {
    var bestCell;
    var bestCounts = [];
    for (var _i = 0, cells_1 = cells; _i < cells_1.length; _i++) {
        var cell = cells_1[_i];
        if (cell.used)
            continue;
        var counts = cell.getLineCompletionDesc();
        for (var i = 0; i < counts.length || i < bestCounts.length; i++) {
            if (bestCounts[i] === undefined || counts[i] > bestCounts[i]) {
                bestCounts = counts;
                bestCell = cell;
                break;
            }
            else if (counts[i] === undefined || counts[i] < bestCounts[i]) {
                break;
            }
        }
    }
    return bestCell;
}
// return unused cell that is part of most finishable four-line patterns, falling back to three and two lines
function getHottestCell(field, remainingMoves) {
    var heatmap = getHeatMapOfBestPatterns(field, remainingMoves);
    lastUsedHeatmap = heatmap;
    if (!heatmap) {
        return getMostCompleteCell(field.cells);
    }
    var baseCells = field.cells;
    var hotCells = [];
    do {
        var maxHeat = Number.NEGATIVE_INFINITY;
        for (var i = 0; i < baseCells.length; i++) {
            var cell = baseCells[i];
            if (cell.used) {
                continue;
            }
            var heat = heatmap[cell.id - 1];
            if (heat > maxHeat) {
                maxHeat = heat;
                hotCells = [cell];
            }
            else if (heat === maxHeat) {
                hotCells.push(cell);
            }
        }
        if (hotCells.length === 1) {
            break;
        }
        remainingMoves--;
        heatmap = getHeatMapOfBestPatterns(field, remainingMoves, false);
        if (!heatmap || remainingMoves === 1) {
            break;
        }
        baseCells = hotCells;
        hotCells = [];
    } while (true);
    return getMostCompleteCell(hotCells);
}
function getHeatMapOfBestPatterns(field, remainingMoves, updateLastUsed) {
    if (updateLastUsed === void 0) { updateLastUsed = true; }
    var patterns = [];
    var _loop_1 = function (i) {
        var patternLib = patternLibs[i];
        patterns = patternLib.patterns.filter(function (pattern) { return field.finishable(pattern, remainingMoves - patternLib.remainingMovesOffset); });
        if (patterns.length > 0) {
            if (updateLastUsed) {
                lastUsedPatterns = "".concat(patternLib.lines, "-line patterns finishable with ").concat(16 - patternLib.remainingMovesOffset, " moves");
            }
            return "break";
        }
    };
    for (var i = 0; i < patternLibs.length; i++) {
        var state_1 = _loop_1(i);
        if (state_1 === "break")
            break;
    }
    if (patterns.length === 0) {
        if (updateLastUsed) {
            lastUsedPatterns = 'None - only 1-line solutions possible.';
        }
        return null;
    }
    return createHeatmap(patterns);
}
function createHeatmap(patterns) {
    var heatmap = Array(patterns[0].cells.length).fill(0);
    for (var _i = 0, patterns_1 = patterns; _i < patterns_1.length; _i++) {
        var pattern = patterns_1[_i];
        for (var i = 0; i < pattern.cells.length; i++) {
            if (pattern.cells[i].used) {
                heatmap[i]++;
            }
        }
    }
    return heatmap;
}
function createPatterns(targetLines, maxMoves, field, line, index, indices, patterns) {
    if (targetLines === void 0) { targetLines = 4; }
    if (maxMoves === void 0) { maxMoves = 16; }
    if (field === void 0) { field = new Field(); }
    if (line === void 0) { line = 1; }
    if (index === void 0) { index = 0; }
    if (indices === void 0) { indices = []; }
    if (patterns === void 0) { patterns = {}; }
    for (; index < field.lines.length - targetLines + line; index++) {
        indices.push(index);
        if (line === targetLines) {
            for (var _i = 0, indices_1 = indices; _i < indices_1.length; _i++) {
                var lineIndex = indices_1[_i];
                for (var cellIndex = 0; cellIndex < field.lines[lineIndex].cells.length; cellIndex++) {
                    field.lines[lineIndex].cells[cellIndex].used = true;
                }
            }
            var moves = 0;
            for (var _a = 0, _b = field.cells; _a < _b.length; _a++) {
                var cell = _b[_a];
                if (cell.used) {
                    moves++;
                }
            }
            if (moves <= maxMoves) {
                if (!patterns[moves]) {
                    patterns[moves] = [];
                }
                patterns[moves].push(field.clone());
            }
            field.reset();
        }
        else {
            createPatterns(targetLines, maxMoves, field, line + 1, index + 1, indices, patterns);
        }
        indices.pop();
    }
    return patterns;
}
var fourLinePatterns = createPatterns(4);
console.assert(Object.keys(fourLinePatterns).length === 3);
var fourLinePatterns14Moves = fourLinePatterns[14];
var fourLinePatterns15Moves = fourLinePatterns[15];
var fourLinePatterns16Moves = fourLinePatterns[16];
var fourLinePatterns14And15Moves = fourLinePatterns14Moves.concat(fourLinePatterns15Moves);
var allFourLinePatterns = fourLinePatterns14And15Moves.concat(fourLinePatterns16Moves);
var threeLinePatterns = createPatterns(3);
console.assert(Object.keys(threeLinePatterns).length === 3);
var threeLinePatterns12Moves = threeLinePatterns[12];
var threeLinePatterns13Moves = threeLinePatterns[13];
var threeLinePatterns15Moves = threeLinePatterns[15];
var threeLinePatterns12And13Moves = threeLinePatterns12Moves.concat(threeLinePatterns13Moves);
var allThreeLinePatterns = threeLinePatterns12And13Moves.concat(threeLinePatterns15Moves);
var allTwoLinePatterns = (_a = []).concat.apply(_a, Object.values(createPatterns(2)));
var patternLibs = [
    {
        lines: 4,
        patterns: allFourLinePatterns,
        remainingMovesOffset: 2
    },
    {
        lines: 4,
        patterns: allFourLinePatterns,
        remainingMovesOffset: 1
    },
    {
        lines: 4,
        patterns: allFourLinePatterns,
        remainingMovesOffset: 0
    },
    {
        lines: 3,
        patterns: allThreeLinePatterns,
        remainingMovesOffset: 1
    },
    {
        lines: 3,
        patterns: allThreeLinePatterns,
        remainingMovesOffset: 0
    },
    {
        lines: 2,
        patterns: allTwoLinePatterns,
        remainingMovesOffset: 1
    },
    {
        lines: 2,
        patterns: allTwoLinePatterns,
        remainingMovesOffset: 0
    },
];
var strategies = [
    {
        name: 'hottest cell in remaining patterns, then most complete',
        getNextMove: function (field, move, remainingMoves) {
            return getHottestCell(field, remainingMoves);
        },
        totalRounds: 0,
        fourLineWins: 0,
        threeLineWins: 0,
        twoLineWins: 0,
        oneLineWins: 0
        // chances: 26.046919839359617, 69.16415871575377, 4.783306288799452, 0.005615156087161295
        /*
            actual data:
            24 games    (100.0%)
            4 lines: 10 ( 41.7%)
            3 lines: 13 ( 54.2%)
            2 lines: 1  (  4.2%)

            14 games    (100.0%)
            4 lines: 5  ( 35.7%)
            3 lines: 9  ( 64.3%)
        */
    },
];
function randomBenchmark() {
    var field = new Field();
    console.time();
    var _loop_2 = function (i) {
        for (var _i = 0, strategies_1 = strategies; _i < strategies_1.length; _i++) {
            var strat = strategies_1[_i];
            for (var move = 1; move <= 16; move += 2) {
                strat.getNextMove(field, move, 16 - move + 1).use();
                getRandomFreeCell(field.cells).use();
            }
            if (field.linesCompleted >= 4) {
                strat.fourLineWins++;
            }
            else if (field.linesCompleted === 3) {
                strat.threeLineWins++;
            }
            else if (field.linesCompleted === 2) {
                strat.twoLineWins++;
            }
            else if (field.linesCompleted === 1) {
                strat.oneLineWins++;
            }
            else {
                console.log('Worse than 1.');
                field.print();
            }
            field.reset();
        }
        if (i % 10000 === 0) {
            console.log(strategies.map(function (strat) { return strat.name + ': ' + strat.fourLineWins / i * 100 + ', ' + strat.threeLineWins / i * 100 + ', ' + strat.twoLineWins / i * 100 + ', ' + strat.oneLineWins / i * 100; }).join('\n'));
            console.timeLog();
        }
    };
    // the accuracy after 1M is about +/-0.04 percent point, after 10M +/- 0.01 percent point and after 100M +/- 0.005
    for (var i = 1; i <= 10000000; i++) {
        _loop_2(i);
    }
    console.timeEnd();
}
function fullBenchmark() {
    var workerpool = require('workerpool');
    if (!workerpool.isMainThread) {
        workerpool.worker({ benchmarkWorker: benchmarkWorker });
        return;
    }
    var pool = workerpool.pool(__filename, { minWorkers: 'max', maxWorkers: workerpool.cpus });
    var strategyPromises = [];
    var _loop_3 = function (strategyIndex) {
        var promises = [];
        var strategy = strategies[strategyIndex];
        var partialResults = [];
        var totalRoundsTarget = 5109350400;
        var startTime = Date.now();
        var _loop_4 = function (i) {
            var partitionIndex = i;
            var promise_1 = pool.exec('benchmarkWorker', [strategyIndex, partitionIndex], {
                on: function (payload) {
                    partialResults[partitionIndex] = payload;
                    var result = accumulatePartialResults(partialResults);
                    if (result.totalRounds % 1000000 === 0) {
                        // rounds per ms
                        var speed = result.totalRounds / (Date.now() - startTime);
                        var eta = (totalRoundsTarget - result.totalRounds) / speed;
                        var hours = Math.floor(eta / 3600000);
                        var minutes = Math.floor((eta - hours * 3600000) / 60000);
                        console.log("".concat(hours, " h ").concat(minutes, " m (").concat(speed, " rounds/ms)"));
                    }
                }
            });
            promises.push(promise_1);
        };
        for (var i = 0; i < 25; i++) {
            _loop_4(i);
        }
        var promise = Promise.all(promises).then(function (results) {
            var result = accumulatePartialResults(results);
            Object.assign(strategy, result);
        });
        strategyPromises.push(promise);
    };
    for (var strategyIndex = 0; strategyIndex < strategies.length; strategyIndex++) {
        _loop_3(strategyIndex);
    }
    Promise.all(strategyPromises).then(function () {
        console.log(strategies.map(function (s) { return s.name + ': ' + s.fourLineWins / s.totalRounds * 100 + ', ' + s.threeLineWins / s.totalRounds * 100 + ', ' + s.twoLineWins / s.totalRounds * 100 + ', ' + s.oneLineWins / s.totalRounds * 100; }).join('\n'));
    });
}
function accumulatePartialResults(partialResults) {
    return partialResults.reduce(function (result, partialResult) {
        var _a, _b, _c, _d, _e;
        result.totalRounds = ((_a = result.totalRounds) !== null && _a !== void 0 ? _a : 0) + partialResult.totalRounds;
        result.fourLineWins = ((_b = result.fourLineWins) !== null && _b !== void 0 ? _b : 0) + partialResult.fourLineWins;
        result.threeLineWins = ((_c = result.threeLineWins) !== null && _c !== void 0 ? _c : 0) + partialResult.threeLineWins;
        result.twoLineWins = ((_d = result.twoLineWins) !== null && _d !== void 0 ? _d : 0) + partialResult.twoLineWins;
        result.oneLineWins = ((_e = result.oneLineWins) !== null && _e !== void 0 ? _e : 0) + partialResult.oneLineWins;
        return result;
    }, {});
}
function benchmarkWorker(strategyIndex, partitionIndex, maxMoves, field, move, result) {
    if (maxMoves === void 0) { maxMoves = 16; }
    if (field === void 0) { field = new Field(); }
    if (move === void 0) { move = 1; }
    var workerpool = require('workerpool');
    if (move === 1) {
        result = {
            totalRounds: 0,
            fourLineWins: 0,
            threeLineWins: 0,
            twoLineWins: 0,
            oneLineWins: 0
        };
    }
    var nextCell = strategies[strategyIndex].getNextMove(field, move, maxMoves - move + 1);
    nextCell.use();
    move++;
    for (var i = (move === 2 ? partitionIndex : 0); i < (move === 2 ? partitionIndex + 1 : field.cells.length); i++) {
        var cell = field.cells[i];
        if (cell.used) {
            continue;
        }
        cell.use();
        if (move === maxMoves) {
            result.totalRounds++;
            if (field.linesCompleted >= 4) {
                result.fourLineWins++;
            }
            else if (field.linesCompleted === 3) {
                result.threeLineWins++;
            }
            else if (field.linesCompleted === 2) {
                result.twoLineWins++;
            }
            else if (field.linesCompleted === 1) {
                result.oneLineWins++;
            }
            else {
                console.log('Worse than 1.');
                field.print();
            }
            if (result.totalRounds % 100000 === 0) {
                workerpool.workerEmit(result);
            }
        }
        else {
            benchmarkWorker(strategyIndex, partitionIndex, maxMoves, field, move + 1, result);
        }
        cell.used = false;
    }
    nextCell.used = false;
    if (move === 2) {
        return result;
    }
}
var field = new Field();
var LABEL_PREFIX = 'l';
var CHECKBOX_PREFIX = 'cb';
var SPAN_PREFIX = 's';
var CHECKBOX_STATES = {
    MARKED: 'marked',
    NEXT: 'next',
    BINGO: 'bingo',
    HEATMAP: 'heatmap',
    NONE: 'none',
};
var THEME = {
    DARK: 'dark',
    LIGHT: 'light',
};
var lastMarkedId = null;
var heatmapActive = false;
var lastUsedPatterns = 'None';
var lastUsedHeatmap = null;
function initWebsite() {
    var theme = window.matchMedia('(prefers-color-scheme: light)').matches ? THEME.LIGHT : THEME.DARK;
    var html = "\n    <div style=\"font-family: Arial, sans-serif\">\n        <div style=\"display: grid;grid-template-columns: min-content 1fr; margin-bottom: 20px;\">\n            <div class=\"bingo-grid\">\n    ";
    for (var _i = 0, _a = field.cells; _i < _a.length; _i++) {
        var cell = _a[_i];
        html += "\n        <label id=\"".concat(LABEL_PREFIX + cell.id, "\" class=\"grid-cell\">\n            ").concat(cell.id.toString().padStart(2, '0'), "\n            <br>\n            <input id=\"").concat(CHECKBOX_PREFIX + cell.id, "\" type=\"checkbox\" onClick=\"checkboxClicked(this, ").concat(cell.id, ")\"/>\n            <br>\n            <span id=\"").concat(SPAN_PREFIX + cell.id, "\">\n            </span>\n        </label>\n        ");
    }
    html += "\n            </div>\n            <div style=\"margin-left: 20px\">\n                <p><span style=\"font-weight: bold\">Current move: </span><span id=\"move\"></span></p>\n                <p><span style=\"font-weight: bold\">Next step: </span><span id=\"message\"></span></p>\n                <p><span style=\"font-weight: bold\">Current pattern library: </span><span id=\"usedPatterns\"></span></p>\n                <p>\n                    <button onclick=\"reset()\">Reset</button><label style=\"margin-left: 20px\">\n                    <input type=\"checkbox\" onclick=\"toggleHeatmap(this)\">Show heatmap</label>\n                    <label style=\"margin-left: 20px\"><input type=\"checkbox\" onclick=\"toggleDarkTheme(this.checked)\" ".concat(theme === THEME.DARK ? 'checked' : '', ">Toggle Dark Mode</label>\n                </p>\n            </div>\n        </div>\n        <p>This tool finds all finishable 4-line patterns and calculates a heatmap of the most used cells. Afterwards it suggests your next best move by marking the checkbox in blue color.</p>\n        <p>If multiple cells have the same heat it picks the cell that has the most active siblings on the lines crossing it. If no 4-line patterns are possible anymore it switches to 3-line and then 2-line patterns.</p>\n        <p>This strategy leads to roughly 26.0% 4-line wins, 69.2% 3-line wins and 4.8% 2-line wins. The relatively high proportion of 2-line wins is because this tool prioritizes 4-line wins over everything else because they give disproportionally higher rewards.</p>\n        <p>Completed lines are marked in green. If you enable the heatmap you can see the count of remaining patterns each cell is part of within the current pattern library.</p>\n    </div>\n    ");
    document.body.innerHTML = html;
    if (theme === THEME.DARK) {
        toggleDarkTheme(true);
    }
    else {
        toggleDarkTheme(false);
    }
    reset();
}
function toggleHeatmap(checkbox) {
    heatmapActive = checkbox.checked;
    if (heatmapActive) {
        drawHeatmap();
    }
    else {
        clearHeatmap();
    }
}
function clearHeatmap() {
    for (var _i = 0, _a = field.cells; _i < _a.length; _i++) {
        var cell = _a[_i];
        if (!cell.used && cell.id !== lastMarkedId) {
            setCheckboxState(cell.id, CHECKBOX_STATES.NONE);
        }
        setHeatmapInfo(cell.id, null);
    }
}
function drawHeatmap() {
    var heatmap = lastUsedHeatmap;
    if (!heatmap) {
        clearHeatmap();
        return;
    }
    var min = Math.min.apply(Math, heatmap);
    var max = Math.max.apply(Math, heatmap);
    for (var _i = 0, _a = field.cells; _i < _a.length; _i++) {
        var cell = _a[_i];
        setHeatmapInfo(cell.id, null);
        if (!cell.used) {
            if (cell.id !== lastMarkedId) {
                var colorShade = 100 - 100 * (heatmap[cell.id - 1] - min) / (max - min);
                setCheckboxState(cell.id, CHECKBOX_STATES.HEATMAP);
                setCheckboxColor(cell.id, "rgb(255, ".concat(100 + colorShade, ", ").concat(100 + colorShade, ")"));
            }
            setHeatmapInfo(cell.id, heatmap[cell.id - 1]);
        }
    }
}
function reset() {
    field.reset();
    for (var _i = 0, _a = field.cells; _i < _a.length; _i++) {
        var cell = _a[_i];
        document.getElementById(CHECKBOX_PREFIX + cell.id).checked = false;
        setCheckboxState(cell.id, CHECKBOX_STATES.NONE);
    }
    markNextMove();
    if (heatmapActive) {
        drawHeatmap();
    }
    displayMoveNumber(1);
    displayMessage('Input your turn. The middle cell (13) is the best start.');
}
function toggleDarkTheme(toggled) {
    if (toggled) {
        document.querySelector('html').setAttribute('data-theme', 'dark');
    }
    else {
        document.querySelector('html').setAttribute('data-theme', 'light');
    }
}
function checkboxClicked(checkbox, id) {
    if (!checkbox.checked) {
        // checkboxes can only be reset by resetting the whole round
        checkbox.checked = true;
        return;
    }
    if (field.usedCellCount >= 16) {
        checkbox.checked = false;
        return;
    }
    var cell = field.cells[id - 1];
    cell.used = checkbox.checked;
    if (lastMarkedId) {
        setCheckboxState(lastMarkedId, CHECKBOX_STATES.NONE);
        lastMarkedId = null;
    }
    setCheckboxState(id, CHECKBOX_STATES.MARKED);
    for (var _i = 0, _a = cell.lines; _i < _a.length; _i++) {
        var line = _a[_i];
        if (line.isComplete) {
            for (var _b = 0, _c = line.cells; _b < _c.length; _b++) {
                var lineCell = _c[_b];
                setCheckboxState(lineCell.id, CHECKBOX_STATES.BINGO);
            }
        }
    }
    if (field.usedCellCount >= 16) {
        displayMessage('No more turns.');
        return;
    }
    if (field.usedCellCount % 2 === 1) {
        displayMessage('Input the computer\'s turn.');
        clearHeatmap();
    }
    else {
        displayMessage('Input your turn.');
        markNextMove();
    }
    displayMoveNumber(field.usedCellCount + 1);
}
function markNextMove() {
    var nextId = getHottestCell(field, 16 - field.usedCellCount).id;
    setCheckboxState(nextId, CHECKBOX_STATES.NEXT);
    lastMarkedId = nextId;
    if (heatmapActive) {
        drawHeatmap();
    }
    displayUsedPatterns(lastUsedPatterns);
}
function setCheckboxColor(id, color) {
    document.getElementById(LABEL_PREFIX + id).style.backgroundColor = color;
}
function setCheckboxState(id, state) {
    var checkbox = document.getElementById(LABEL_PREFIX + id);
    // remove heatmap color if exists
    if (checkbox.getAttribute('data-state') === CHECKBOX_STATES.HEATMAP) {
        setCheckboxColor(id, '');
    }
    checkbox.setAttribute('data-state', state);
}
function setHeatmapInfo(id, heat) {
    var _a;
    document.getElementById(SPAN_PREFIX + id).innerText = (_a = heat === null || heat === void 0 ? void 0 : heat.toString()) !== null && _a !== void 0 ? _a : '';
}
function displayMoveNumber(moveNumber) {
    document.getElementById('move').innerText = moveNumber + ' / 16';
}
function displayMessage(text) {
    document.getElementById('message').innerText = text;
}
function displayUsedPatterns(patternName) {
    document.getElementById('usedPatterns').innerText = patternName;
}
// randomBenchmark();
// fullBenchmark();
window.onload = initWebsite;
