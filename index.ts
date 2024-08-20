

class Field {
    rows: Line[] = [];
    columns: Line[] = [];
    diagonals: Line[] = [new Line(), new Line()];
    lines: Line[];
    cells: Cell[] = [];

    get linesCompleted() {
        let count = 0;

        for (let i = 0; i < this.lines.length; i++) {
            if (this.lines[i].isComplete) {
                count++;
            }
        }

        return count;
    }

    // a cell is redundant if it does not complete any line
    get hasRedundantCells() {
        outer:
        for (const cell of this.cells) {
            if (!cell.used) {
                continue;
            }

            for (const line of cell.lines) {
                if (line.isComplete) {
                    continue outer;
                }
            }

            return true;
        }

        return false;
    }

    get usedCellCount() {
        let count = 0;

        for (const cell of this.cells) {
            if (cell.used) {
                count++;
            }
        }

        return count;
    }

    constructor(public size = 5) {
        for (let i = 0; i < size; i++) {
            const row = new Line();
            this.rows.push(row);

            for (let j = 0; j < size; j++) {
                if (i === 0) {
                    this.columns.push(new Line());
                }

                const column = this.columns[j];

                const cell = new Cell(i * size + j + 1, this, row, column);
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

        this.lines = [...this.columns, ...this.rows, ...this.diagonals];
    }

    reset() {
        for (const cell of this.cells) {
            cell.used = false;
        }
    }

    getRemainingMoves(targetPattern: Field) {
        let remainingMoves = 0;

        for (let i = 0; i < this.cells.length; i++) {
            if (targetPattern.cells[i].used && !this.cells[i].used) {
                remainingMoves++;
            }
        }

        return remainingMoves;
    }

    clone() {
        const clone = new Field(this.size);

        for (let i = 0; i < this.cells.length; i++) {
            clone.cells[i].used = this.cells[i].used;
        }

        return clone;
    }

    print() {
        for (const row of this.rows) {
            let output = '';

            for (const cell of row.cells) {
                output += cell.used ? 'x ' : 'o ';
            }

            console.log(output);
        }
    }
}

class Line {
    cells: Cell[] = [];

    get isComplete() {
        for (let i = 0; i < this.cells.length; i++) {
            if (!this.cells[i].used) {
                return false;
            }
        }

        return true;
    }
}

class Cell {
    used = false;
    lines: Line[] = [];
    diagonals: Line[] = [];
    
    constructor(public id: number, public field: Field, public row: Line, public column: Line) {
        this.lines.push(row, column);
    }

    getLineCompletionDesc() {
        let counts: number[] = [];
        
        for (const line of this.lines) {
            let lineCount = 0;

            for (const cell of line.cells) {
                if (cell.used) {
                    lineCount++;
                }
            }

            counts.push(lineCount);
        }

        return counts.sort((a, b) => b - a);
    }

    use() {
        if (this.used) {
            throw new Error('Cell already used.');
        }

        this.used = true;
    }
}

function getRandomFreeCell(cells: Cell[]) {
    const freeCells = cells.filter(cell => !cell.used);

    if (freeCells.length === 0) {
        return null;
    }

    return freeCells[Math.floor(Math.random() * freeCells.length)];
}

// returns unused cell which has the most complete lines
function getMostCompleteCell(cells: Cell[]) {
    let bestCell: Cell;
    let bestCounts: number[] = [];

    for (const cell of cells) {
        if (cell.used) continue;

        const counts = cell.getLineCompletionDesc();

        for (let i = 0; i < counts.length || i < bestCounts.length; i++) {
            if (bestCounts[i] === undefined || counts[i] > bestCounts[i]) {
                bestCounts = counts;
                bestCell = cell;

                break;
            } else if (counts[i] === undefined || counts[i] < bestCounts[i]) {
                break;
            }
        }
    }

    return bestCell!;
}

// return unused cell that is part of most finishable four-line patterns, falling back to three and two lines
function getHottestCell(field: Field, remainingMoves: number) {
    let heatmap = getHeatMapOfBestPatterns(field, remainingMoves);
    lastUsedHeatmap = heatmap;

    if (!heatmap) {
        return getMostCompleteCell(field.cells);
    }

    let baseCells = field.cells;
    let hotCells: Cell[] = [];
    
    do {
        let maxHeat = Number.NEGATIVE_INFINITY;

        for (let i = 0; i < baseCells.length; i++) {
            const cell = baseCells[i];

            if (cell.used) {
                continue;
            }

            const heat = heatmap[cell.id - 1];

            if (heat > maxHeat) {
                maxHeat = heat;
                hotCells = [cell];
            } else if (heat === maxHeat) {
                hotCells.push(cell);
            }
        }

        // if we'd break here the chances change to 25.916234889664253, 69.1807044981687, 4.897963604140362, 0.005097008026695527

        if (hotCells.length === 1) {
            break;
        }
        
        remainingMoves--;
        heatmap = getHeatMapOfBestPatterns(field, remainingMoves, false);

        if (!heatmap) {
            break;
        }

        baseCells = hotCells;
        hotCells = [];
    } while(true);

    return getMostCompleteCell(hotCells)
}

function getHeatMapOfBestPatterns(field: Field, remainingMoves: number, updateLastUsed = true) {
    // get patterns that are finishable with the second to last move (which is the last controllable one)
    let patterns = allFourLinePatterns.filter(pattern => field.getRemainingMoves(pattern) < remainingMoves);
    if (updateLastUsed) lastUsedPatterns = `4-line patterns finishable with less than ${remainingMoves} moves`;

    // fall back to patterns finishable with the last move
    if (patterns.length === 0) {
        patterns = allFourLinePatterns.filter(pattern => field.getRemainingMoves(pattern) <= remainingMoves);
        if (updateLastUsed) lastUsedPatterns = `4-line patterns finishable with at most ${remainingMoves} moves`;
    }
    
    // fall back to three-line patterns
    if (patterns.length === 0) {
        patterns = allThreeLinePatterns.filter(pattern => field.getRemainingMoves(pattern) < remainingMoves);
        if (updateLastUsed) lastUsedPatterns = `3-line patterns finishable with less than ${remainingMoves} moves`;
    }

    if (patterns.length === 0) {
        patterns = allThreeLinePatterns.filter(pattern => field.getRemainingMoves(pattern) <= remainingMoves);
        if (updateLastUsed) lastUsedPatterns = `3-line patterns finishable with at most ${remainingMoves} moves`;
    }

    // fall back to two-line patterns
    if (patterns.length === 0) {
        patterns = allTwoLinePatterns.filter(pattern => field.getRemainingMoves(pattern) < remainingMoves);
        if (updateLastUsed) lastUsedPatterns = `2-line patterns finishable with less than ${remainingMoves} moves`;
    }

    if (patterns.length === 0) {
        patterns = allTwoLinePatterns.filter(pattern => field.getRemainingMoves(pattern) <= remainingMoves);
        if (updateLastUsed) lastUsedPatterns = `2-line patterns finishable with at most ${remainingMoves} moves`;
    }

    if (patterns.length === 0) {      
        if (updateLastUsed) lastUsedPatterns = 'None - only 1-line solutions possible.'          
        return null;
    }

    return createHeatmap(patterns);
}

function createHeatmap(patterns: Field[]) {
    const heatmap: number[] = Array(patterns[0].cells.length).fill(0);

    for (const pattern of patterns) {
        for (let i = 0; i < pattern.cells.length; i++) {
            if (pattern.cells[i].used) {
                heatmap[i]++;
            }
        }
    }

    return heatmap;
}

function createPatterns(targetLines = 4, maxMoves = 16, field = new Field(), line = 1, index = 0, indices: number[] = [], patterns: {[key: number]: Field[]} = {}) {
    for( ; index < field.lines.length - targetLines + line; index++) {
        indices.push(index);
        
        if (line === targetLines) {
            for (const lineIndex of indices) {
                for (let cellIndex = 0; cellIndex < field.lines[lineIndex].cells.length; cellIndex++) {
                    field.lines[lineIndex].cells[cellIndex].used = true;
                }
            }

            let moves = 0;

            for (const cell of field.cells) {
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

const fourLinePatterns = createPatterns(4);
console.assert(Object.keys(fourLinePatterns).length === 3);
const fourLinePatterns14Moves = fourLinePatterns[14];
const fourLinePatterns15Moves = fourLinePatterns[15];
const fourLinePatterns16Moves = fourLinePatterns[16];
const fourLinePatterns14And15Moves = fourLinePatterns14Moves.concat(fourLinePatterns15Moves);
const allFourLinePatterns = fourLinePatterns14And15Moves.concat(fourLinePatterns16Moves);


const threeLinePatterns = createPatterns(3);
console.assert(Object.keys(threeLinePatterns).length === 3);
const threeLinePatterns12Moves = threeLinePatterns[12];
const threeLinePatterns13Moves = threeLinePatterns[13];
const threeLinePatterns15Moves = threeLinePatterns[15];
const threeLinePatterns12And13Moves = threeLinePatterns12Moves.concat(threeLinePatterns13Moves);
const allThreeLinePatterns = threeLinePatterns12And13Moves.concat(threeLinePatterns15Moves);

const allTwoLinePatterns = ([] as Field[]).concat(...Object.values(createPatterns(2)));

const strategies = [
    {
        name: 'hottest cell in remaining patterns, then most complete',
        getNextMove(field: Field, move: number, remainingMoves: number) {
            return getHottestCell(field, remainingMoves);
        },
        totalRounds: 0,
        fourLineWins: 0,
        threeLineWins: 0,
        twoLineWins: 0,
        oneLineWins: 0
        // chances: 25.928858236068525, 69.27970465677986, 4.785619263850059, 0.0058178433015672595
        /*
            actual data:
            24 games    (100.0%)
            4 lines: 10 ( 41.7%)
            3 lines: 13 ( 54.2%)
            2 lines: 1  (  4.2%)
        */
    },
];

type PartialStrategyResult = {
    totalRounds: number,
    fourLineWins: number,
    threeLineWins: number,
    twoLineWins: number,
    oneLineWins: number
};


function randomBenchmark() {
    const field = new Field();

    console.time();

    // the accuracy after 1M is about +/-0.04 percent point, after 10M +/- 0.01 percent point and after 100M +/- 0.005
    for (let i = 1; i <= 10000000; i++) {
        for (const strat of strategies) {
            for (let move = 1; move <= 16; move += 2) {
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
            console.log(strategies.map(strat => strat.name + ': ' + strat.fourLineWins / i * 100 + ', ' + strat.threeLineWins / i * 100 + ', ' + strat.twoLineWins / i * 100 + ', ' + strat.oneLineWins / i * 100).join('\n'));
            console.timeLog();
        }
    }

    console.timeEnd();
}

function fullBenchmark() {
    const workerpool = require('workerpool');

    if (!workerpool.isMainThread) {
        workerpool.worker({ benchmarkWorker });

        return;
    }
    
    const pool = workerpool.pool(__filename, { minWorkers: 'max', maxWorkers: workerpool.cpus  });
    const strategyPromises: Promise<void>[] = [];
    
    for (let strategyIndex = 0; strategyIndex < strategies.length; strategyIndex++) {
        const promises: Promise<PartialStrategyResult>[] = [];
        const strategy = strategies[strategyIndex];
        const partialResults: PartialStrategyResult[] = [];
        const totalRoundsTarget = 5109350400;
        const startTime = Date.now();

        for (let i = 0; i < 25; i++) {
            const partitionIndex = i;
            const promise = pool.exec(
                'benchmarkWorker', 
                [strategyIndex, partitionIndex], 
                { 
                    on(payload: PartialStrategyResult) {
                        partialResults[partitionIndex] = payload;

                        const result = accumulatePartialResults(partialResults);

                        if (result.totalRounds % 1000000 === 0) {
                            // rounds per ms
                            const speed = result.totalRounds / (Date.now() - startTime);
                            const eta = (totalRoundsTarget - result.totalRounds) / speed;
                            const hours = Math.floor(eta / 3600000);
                            const minutes = Math.floor((eta - hours * 3600000) / 60000);
                            console.log(`${hours} h ${minutes} m (${speed} rounds/ms)`);
                        }
                    } 
                });
            promises.push(promise);
        }

        const promise = Promise.all(promises).then(results => {
            const result = accumulatePartialResults(results);
            Object.assign(strategy, result);
        });

        strategyPromises.push(promise);
    }

    Promise.all(strategyPromises).then(() => {
        console.log(strategies.map(s => s.name + ': ' + s.fourLineWins / s.totalRounds * 100 + ', ' + s.threeLineWins / s.totalRounds * 100 + ', ' + s.twoLineWins / s.totalRounds * 100 + ', ' + s.oneLineWins / s.totalRounds * 100).join('\n'));
    });

}

function accumulatePartialResults(partialResults: PartialStrategyResult[]) {
    return partialResults.reduce((result, partialResult) => {
        result.totalRounds = (result.totalRounds ?? 0) + partialResult.totalRounds;
        result.fourLineWins = (result.fourLineWins ?? 0) + partialResult.fourLineWins;
        result.threeLineWins = (result.threeLineWins ?? 0) + partialResult.threeLineWins;
        result.twoLineWins = (result.twoLineWins ?? 0) + partialResult.twoLineWins;
        result.oneLineWins = (result.oneLineWins ?? 0) + partialResult.oneLineWins;

        return result;
    }, {} as PartialStrategyResult);
}

function benchmarkWorker(strategyIndex: number, partitionIndex: number, maxMoves = 16, field = new Field(), move = 1, result: PartialStrategyResult): PartialStrategyResult {
    const workerpool = require('workerpool');

    if (move === 1) {
        result = {
            totalRounds: 0,
            fourLineWins: 0,
            threeLineWins: 0,
            twoLineWins: 0,
            oneLineWins: 0
        };
    }

    const nextCell = strategies[strategyIndex].getNextMove(field, move, maxMoves - move + 1);
    nextCell.use();
    move++;
    
    for (let i = (move === 2 ? partitionIndex : 0); i < (move === 2 ? partitionIndex + 1 : field.cells.length); i++) {
        const cell = field.cells[i];
        
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

const field = new Field();
const LABEL_PREFIX = 'l';
const CHECKBOX_PREFIX = 'cb';
const SPAN_PREFIX = 's';
let lastMarkedId: number | null = null;
let heatmapActive = false;
let lastUsedPatterns = 'None';
let lastUsedHeatmap: number[] | null = null;

function initWebsite() {
    let html = `
    <div style="font-family: Arial, sans-serif">
        <div style="display: grid;grid-template-columns: min-content 1fr; margin-bottom: 20px;">
            <div style="display: inline-grid;grid-template-columns: 80px 80px 80px 80px 80px;grid-template-rows: 80px 80px 80px 80px 80px; border-top: 0.5px solid grey; border-left: 0.5px solid grey">
    `;

    for (const cell of field.cells) {
        html += `<label id="${LABEL_PREFIX + cell.id}" style="padding: 12px 0 0 27px; border-right: 0.5px solid grey; border-bottom: 0.5px solid grey">${cell.id.toString().padStart(2, '0')}<br><input id="${CHECKBOX_PREFIX + cell.id}" type="checkbox" onClick="checkboxClicked(this, ${cell.id})"/><br><span id="${SPAN_PREFIX + cell.id}"></span></label>`;
    }

    html += `
            </div>
            <div style="margin-left: 20px">
                <p><span style="font-weight: bold">Current move: </span><span id="move"></span></p>
                <p><span style="font-weight: bold">Next step: </span><span id="message"></span></p>
                <p><span style="font-weight: bold">Current pattern library: </span><span id="usedPatterns"></span></p>
                <p><button onclick="reset()">Reset</button><label style="margin-left: 20px"><input type="checkbox" onclick="toggleHeatmap(this)">Show heatmap</label></p>
            </div>
        </div>
        <p>This tool finds all finishable 4-line patterns and calculates a heatmap of the most used cells. Afterwards it suggests your next best move by marking the checkbox in blue color.</p>
        <p>If multiple cells have the same heat it picks the cell that has the most active siblings on the lines crossing it. If no 4-line patterns are possible anymore it switches to 3-line and then 2-line patterns.</p>
        <p>This strategy leads to roughly 25.9% 4-line wins, 69.3% 3-line wins and 4.8% 2-line wins. The relatively high proportion of 2-line wins is because this tool prioritizes 4-line wins over everything else because they give disproportionally higher rewards.</p>
        <p>Completed lines are marked in green. If you enable the heatmap you can see the count of remaining patterns each cell is part of.</p>
    </div>
    `;
    document.body.innerHTML = html;
    reset();
}

function toggleHeatmap(checkbox: HTMLInputElement) {
    heatmapActive = checkbox.checked;

    if (heatmapActive) {
        drawHeatmap();
    } else {
        clearHeatmap();
    }
}

function clearHeatmap() {
    for (const cell of field.cells) {
        if (!cell.used && cell.id !== lastMarkedId) {
            setCheckboxColor(cell.id, 'white');
        }

        setHeatmapInfo(cell.id, null);
    }
}

function drawHeatmap() {
    const heatmap = lastUsedHeatmap;

    if (!heatmap) {
        clearHeatmap();

        return;
    }

    const min = Math.min(...heatmap);
    const max = Math.max(...heatmap);

    for (const cell of field.cells) {
        setHeatmapInfo(cell.id, null);

        if (!cell.used) {
            if (cell.id !== lastMarkedId) {
                const colorShade = 100 - 100 * (heatmap[cell.id - 1] - min)  / (max - min);
                setCheckboxColor(cell.id, `rgb(255, ${100 + colorShade}, ${100 + colorShade})`);
            }

            setHeatmapInfo(cell.id, heatmap[cell.id - 1]);
        }
    }
}

function reset() {
    field.reset();

    for (const cell of field.cells) {
        (document.getElementById(CHECKBOX_PREFIX + cell.id) as HTMLInputElement).checked = false;
        setCheckboxColor(cell.id, 'white');
    }

    markNextMove();
    
    if (heatmapActive) {
        drawHeatmap();
    }

    displayMoveNumber(1);
    displayMessage('Input your turn. The middle cell (13) is the best start.');
}

function checkboxClicked(checkbox: HTMLInputElement, id: number) { 
    if (!checkbox.checked) {
        // checkboxes can only be reset by resetting the whole round
        checkbox.checked = true;

        return;
    }

    if (field.usedCellCount >= 16) { 
        checkbox.checked = false;

        return; 
    }
    
    const cell = field.cells[id - 1];
    cell.used = checkbox.checked;

    if (lastMarkedId) {
        setCheckboxColor(lastMarkedId, 'white');
        lastMarkedId = null;
    }
    
    setCheckboxColor(id, 'lightgray');

    for (const line of cell.lines) {
        if (line.isComplete) {
            for (const lineCell of line.cells) {
                setCheckboxColor(lineCell.id, 'lightgreen');
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
    const nextId = getHottestCell(field, 16 - field.usedCellCount).id;
    setCheckboxColor(nextId, 'cornflowerblue');
    lastMarkedId = nextId;

    if (heatmapActive) {
        drawHeatmap();
    }

    displayUsedPatterns(lastUsedPatterns);
}

function setCheckboxColor(id: number, color: string) {
    document.getElementById(LABEL_PREFIX + id)!.style.backgroundColor = color;
}

function setHeatmapInfo(id: number, heat: number | null) {
    document.getElementById(SPAN_PREFIX + id)!.innerText = heat?.toString() ?? '';
}

function displayMoveNumber(moveNumber: number) {
    document.getElementById('move')!.innerText = moveNumber + ' / 16';
}

function displayMessage(text: string) {
    document.getElementById('message')!.innerText = text;
}

function displayUsedPatterns(patternName: string) {
    document.getElementById('usedPatterns')!.innerText = patternName;
}

fullBenchmark();
// window.onload = initWebsite;