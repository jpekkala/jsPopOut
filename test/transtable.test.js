import chai from 'chai';
const { assert } = chai;

import TransTable  from '../src/transtable.js';
import { WIN, UNKNOWN } from '../src/constants.js';

describe('TransTable', function() {

    it('should use default size if size is not given', () => {
        const tt = new TransTable();
        assert.equal(tt.transSize, 2097169);
    })

    it('should use given size', () => {
        const tt = new TransTable(27644437);
        assert.equal(tt.transSize, 27644437);
    })

    it('should remember stored value', () => {
        const tt = new TransTable();
        const pos = 1000;
        tt.store(pos, WIN, 0);
        assert.equal(tt.fetch(pos), WIN);
    })

    it('should keep both the position with highest work and the most recent position on hash collision', () => {
        const tt = new TransTable();
        const pos1 = tt.transSize;
        const pos2 = 2 * tt.transSize;
        const pos3 = 3 * tt.transSize;
        const pos4 = 4 * tt.transSize;

        tt.store(pos1, WIN, 300);
        tt.store(pos2, WIN, 600);
        tt.store(pos3, WIN, 500);
        tt.store(pos4, WIN, 400);

        assert.equal(tt.fetch(pos1), UNKNOWN);
        assert.equal(tt.fetch(pos2), WIN);
        assert.equal(tt.fetch(pos3), UNKNOWN);
        assert.equal(tt.fetch(pos4), WIN);
    })
})
