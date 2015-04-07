jsPopOut
========

jsPopOut is a JavaScript search engine for a Connect-4 variant called PopOut. The search engine uses alpha-beta pruning together with several enhancements to prove that the game is a first-player win. In fact, the first player can always win within 21 moves (plies) if he starts in the middle column.

This project is a derivative of my [Master's thesis](http://herkules.oulu.fi/thesis/nbnfioulu-201405281532.pdf). The search engine I wrote for my Master's thesis was in C++ and it was naturally much more powerful than the JavaScript version. I decided to reimplement it in JavaScript as a challenge. It also provides a lower threshold for the user to try it when he can do it in the browser without downloading anything.


License
-------

This project is released under the [MIT License](LICENSE).
