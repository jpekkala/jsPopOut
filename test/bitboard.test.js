import chai from 'chai';
const { assert } = chai;

import Bitboard from '../src/bitboard.js';

describe('Bitboard', function() {
    it('should set variation', () => {
        const board = new Bitboard();
        board.setVariation('dddddde');
        assert.equal(board.toString(), '' +
                '...O...\n' +
                '...X...\n' +
                '...O...\n' +
                '...X...\n' +
                '...O...\n' +
                '...XX..\n'
        )
    })

    describe('check', function() {
        it('should detect a horizontal line', () => {
            const board = new Bitboard();
            board.setVariation('ddeeffg');
            assert.isTrue(board.hasWhiteWon())
            assert.isFalse(board.hasRedWon());
        })

        it('should detect a vertical line', () => {
            const board = new Bitboard();
            board.setVariation('dededed');
            assert.isTrue(board.hasWhiteWon())
            assert.isFalse(board.hasRedWon());
        })

        it.skip('should detect a diagonal line (/)', () => {

        })

        it.skip('should detect a diagonal line (\\)', () => {

        })
    })
})
