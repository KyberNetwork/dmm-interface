import { LimitOder } from "../pages/limit-order.po.cy"
import { SwapPage, TokenCatalog } from "../pages/swap-page.po.cy"
import { DEFAULT_URL, NETWORK, NORESULTS_TEXT, NOTOKENS_TEXT, TAG, TOKEN_SYMBOLS, UNWHITELIST_SYMBOL_TOKENS, UNWHITELIST_TOKENS } from "../selectors/constants.cy"

const tokenSymbols = TOKEN_SYMBOLS[NETWORK]


const tokenCatalog = new TokenCatalog();


describe(`Token Catalog on ${NETWORK}`, { tags: TAG.regression }, () => {
    beforeEach(() => {
        SwapPage.open(DEFAULT_URL)
        SwapPage.goToLimitOrder()
    })

    describe('Add/remove/select token with favorite tokens list', () => {
        it('Should be added, selected and removed favorite token sell', () => {
            LimitOder.selectTokenSell().addFavoriteToken([tokenSymbols[0], tokenSymbols[4]])
            tokenCatalog.getFavoriteTokens((list) => {
                expect(list).to.include.members([tokenSymbols[4]])
            })

            tokenCatalog.selectFavoriteToken(tokenSymbols[4])
            LimitOder.getCurrentTokenSell((text) => {
                expect(text).to.equal(tokenSymbols[4])
            })
            LimitOder.selectTokenSell()
            tokenCatalog.removeFavoriteToken(tokenSymbols[0])
            tokenCatalog.getFavoriteTokens((list) => {
                expect(list).not.to.include.members([tokenSymbols[0]])
            })
        })

        it('Should be added, selected and removed favorite token buy', () => {
            LimitOder.selectTokenBuy().addFavoriteToken([tokenSymbols[0], tokenSymbols[4]])
            tokenCatalog.getFavoriteTokens((list) => {
                expect(list).to.include.members([tokenSymbols[4]])
            })

            tokenCatalog.selectFavoriteToken(tokenSymbols[4])
            LimitOder.getCurrentTokenBuy((text) => {
                expect(text).to.equal(tokenSymbols[4])
            })
            LimitOder.selectTokenBuy()
            tokenCatalog.removeFavoriteToken(tokenSymbols[0])
            tokenCatalog.getFavoriteTokens((list) => {
                expect(list).not.to.include.members([tokenSymbols[0]])
            })
        })
    })

    describe('Select token by symbol', () => {
        it('Should be selected token sell by symbol successfully', () => {
            LimitOder.selectTokenSell().selectTokenBySymbol(tokenSymbols[0])
            LimitOder.getCurrentTokenSell((text) => {
                expect(text).to.equal(tokenSymbols[0])
            })
        })

        it('Should be selected token buy by symbol successfully', () => {
            LimitOder.selectTokenBuy().selectTokenBySymbol(tokenSymbols[1])
            LimitOder.getCurrentTokenBuy((text) => {
                expect(text).to.equal(tokenSymbols[1])
            })
        })

        it('Should be unselected token sell not exist in whitelist', () => {
            LimitOder.selectTokenSell().searchToken(UNWHITELIST_SYMBOL_TOKENS[0])
            tokenCatalog.getNoResultsFound((text) => {
                expect(text).to.equal(NORESULTS_TEXT)
            })
        })

        it('Should be unselected token buy not exist in whitelist', () => {
            LimitOder.selectTokenBuy().searchToken(UNWHITELIST_SYMBOL_TOKENS[0])
            tokenCatalog.getNoResultsFound((text) => {
                expect(text).to.equal(NORESULTS_TEXT)
            })
        })
    })

    describe('Sell rate', () => {
        it('Able to set sell rate by number', () => {
            LimitOder.setSellRate('1.2345..67')
            LimitOder.getSellRate().then((value) => {
                cy.wrap(value).should('eq', '1.234567')
            })
        })
    })
})