import chai from 'chai';
const { assert } = chai;

import GameEngine from "../src/engine.js";
import { WIN } from '../src/constants.js';

describe('Popout', function() {
    this.timeout(5 * 60 * 1000);

    it('should be a win for the first player', () => {
        const engine = new GameEngine();
        const score = engine.solve();
        assert.equal(score, WIN);
    })
})
