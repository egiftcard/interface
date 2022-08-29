const {expect} = require("chai");
const hre = require("hardhat");
const {loadFixture} = require("@nomicfoundation/hardhat-network-helpers");
const {sign} = require("ethereumjs-util/dist/secp256k1v3-adapter");

const ethers = hre.ethers
const BigNumber = ethers.BigNumber
describe('Router02', function () {
    const decimals18 = 18
    const overrides = {
        gasLimit: 900 * 1e4
    }

    async function deployContracts() {
        let ans = await hre.run("deploy")
        const approveAmount = expandTo18Decimals(1e4)
        let weth = ans.weth
        let tt = ans.tt
        let factory = ans.factory
        let router = ans.router

        await weth.mint()
        await weth.approve(router.address, expandTo18Decimals(approveAmount))
        await tt.mint()
        await tt.approve(router.address, expandTo18Decimals(approveAmount))


        let args = [
            [weth.address, tt.address],
            expandTo18Decimals(100),
            expandTo18Decimals(80),
            1,
            1,
            (await ethers.getSigners())[0].address,
            (Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60 * 1000)
        ]
        await router.addLiquidity(...args)
        let pair = await factory.getPair(weth.address, tt.address, false)
        pair = await (await ethers.getContractFactory("TeleswapV2Pair")).attach(pair)

        let argsStable = [
            [weth.address, tt.address, true],
            expandTo18Decimals(100),
            expandTo18Decimals(80),
            1,
            1,
            (await ethers.getSigners())[0].address,
            (Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60 * 1000)
        ]
        await router.addLiquidity(...argsStable)
        let pairStable = await factory.getPair(weth.address, tt.address, true)
        pairStable = await (await ethers.getContractFactory("TeleswapV2Pair")).attach(pairStable)

        ans.pair = pair
        ans.pairStable = pairStable

        return ans
    }

    describe('calc logic', function () {
        it("getAmountOut", async function () {
            const ans = await loadFixture(deployContracts);

            let router = ans.router

            let reserveIn = expandTo18Decimals("100"), reserveOut = expandTo18Decimals("100"),
                amountIn = expandTo18Decimals("10")
            let desireAmountOut = reserveOut.sub(reserveIn.mul(reserveOut).div(reserveIn.add(amountIn)))
            console.log("volatile desireAmountOut without fee:", ethers.utils.formatEther(desireAmountOut))

            // volatile
            let calcAmount = await router.getAmountOut(amountIn, reserveIn, reserveOut, false, decimals18, decimals18)
            console.log("volatile calcAmount:", ethers.utils.formatEther(calcAmount))
            // stable
            calcAmount = await router.getAmountOut(amountIn, reserveIn, reserveOut, true, decimals18, decimals18)
            console.log("stable calcAmount:", ethers.utils.formatEther(calcAmount))

        });

        it("getAmountsOut", async function () {
            const ans = await loadFixture(deployContracts);

            const weth = ans.weth
            const tt = ans.tt
            const router = ans.router
            const pair = ans.pair
            let token0 = await pair.token0()
            let [reserve0, reserve1] = await pair.getReserves()
            let reserveIn, reserveOut
            if (token0 === weth.address) {
                [reserveIn, reserveOut] = [reserve0, reserve1]
            } else {
                [reserveIn, reserveOut] = [reserve1, reserve0]
            }
            let amountIn = expandTo18Decimals("10")

            let desireAmountOut = reserveOut.sub(reserveIn.mul(reserveOut).div(reserveIn.add(amountIn)))
            console.log("volatile desireAmountOut without fee:", ethers.utils.formatEther(desireAmountOut))

            // volatile
            let args = [
                amountIn,
                [
                    [
                        ans.weth.address,
                        ans.tt.address,
                        false
                    ]
                ]
            ]
            let calcAmount = await router.getAmountsOut(...args)
            console.log("volatile calcAmount:", calcAmount.map(item => ethers.utils.formatEther(item)))
            // stable
            let argsStable = [
                amountIn,
                [
                    [
                        ans.weth.address,
                        ans.tt.address,
                        true
                    ]
                ]
            ]
            calcAmount = await router.getAmountsOut(...argsStable)
            console.log("stable calcAmount:", calcAmount.map(item => ethers.utils.formatEther(item)))
        });

        it("getAmountIn", async function () {
            const ans = await loadFixture(deployContracts);

            let router = ans.router

            let reserveIn = expandTo18Decimals("100"), reserveOut = expandTo18Decimals("100"),
                amountOut = expandTo18Decimals("10")
            // let desireAmountOut = reserveOut.sub(reserveIn.mul(reserveOut).div(reserveIn.add(amountIn)))
            // console.log("volatile desireAmountOut without fee:", desireAmountOut)

            // volatile
            let calcAmount = await router.getAmountIn(amountOut, reserveIn, reserveOut, false, decimals18, decimals18)
            console.log("volatile calcAmount:", ethers.utils.formatEther(calcAmount))
            // // stable
            calcAmount = await router.getAmountIn(amountOut, reserveIn, reserveOut, true, decimals18, decimals18)
            console.log("stable calcAmount:", ethers.utils.formatEther(calcAmount))
        });
        //
        it("getAmountsIn", async function () {
            const ans = await loadFixture(deployContracts);

            const weth = ans.weth
            const tt = ans.tt
            const router = ans.router
            const pair = ans.pair
            let token0 = await pair.token0()
            let [reserve0, reserve1] = await pair.getReserves()
            let reserveIn, reserveOut
            if (token0 === weth.address) {
                [reserveIn, reserveOut] = [reserve0, reserve1]
            } else {
                [reserveIn, reserveOut] = [reserve1, reserve0]
            }
            let amountOut = expandTo18Decimals("10")
            // volatile
            let args = [
                amountOut,
                [
                    [
                        ans.weth.address,
                        ans.tt.address,
                        false
                    ]
                ]
            ]
            let calcAmount = await router.getAmountsIn(...args)
            console.log("volatile calcAmount:", calcAmount.map(item => ethers.utils.formatEther(item)))
            // stable
            let argsStable = [
                amountOut,
                [
                    [
                        ans.weth.address,
                        ans.tt.address,
                        true
                    ]
                ]
            ]
            calcAmount = await  router.getAmountsIn(...argsStable)
            console.log("stable calcAmount:",calcAmount.map(item=>ethers.utils.formatEther(item)))
        });

    })

    describe('core func', function () {
        it("swapExactTokensForTokens", async function () {
            const ans = await loadFixture(deployContracts);
            const signer = (await ethers.getSigners())[0]
            // tt query
            let ttBalanceBefore = await ans.tt.balanceOf(signer.address)
            let wetBalanceBefore = await ans.weth.balanceOf(signer.address)


            // swapExactTokensForTokens
            let amountIn = expandTo18Decimals(1), amountOutMin = 1, to = signer.address
            let deadline = (Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60 * 1000)
            let route = [
                ans.weth.address,
                ans.tt.address,
                false
            ]
            let args = [
                amountIn,
                amountOutMin,
                [route],
                to,
                deadline * 2
            ]
            console.log()
            await ans.router.swapExactTokensForTokens(...args)

            // volatile swap
            let ttBalanceAfter = await ans.tt.balanceOf(signer.address)
            let wethBalanceAfter = await ans.weth.balanceOf(signer.address)
            console.log('weth balance before', wetBalanceBefore)
            console.log('weth balance after', wethBalanceAfter)
            console.log('weth dBalance:', wetBalanceBefore.sub(wethBalanceAfter))
            console.log('tt balance before', ttBalanceBefore)
            console.log('tt balance after', ttBalanceAfter)
            console.log('tt dBalance:', ttBalanceAfter.sub(ttBalanceBefore))


            // stable swap
            console.log("stable swap")
            // tt query
            let ttbefore = await ans.tt.balanceOf(signer.address)
            let wetbefore = await ans.weth.balanceOf(signer.address)
            route
            let stableArgs =
                [
                    amountIn,
                    amountOutMin,
                    [
                        [
                            ans.weth.address,
                            ans.tt.address,
                            true
                        ]
                    ],
                    to,
                    deadline * 2
                ]

            await ans.router.swapExactTokensForTokens(...stableArgs)
            let ttAfter = await ans.tt.balanceOf(signer.address)
            let wethAfter = await ans.weth.balanceOf(signer.address)
            console.log('weth balance before', wetbefore)
            console.log('weth balance after', wethAfter)
            console.log('weth dBalance:', wetbefore.sub(wethAfter))
            console.log('tt balance before', ttbefore)
            console.log('tt balance after', ttAfter)
            console.log('tt dBalance:', ttAfter.sub(ttbefore))

        })
    })


});


function expandTo18Decimals(n) {
    return BigNumber.from(n).mul(BigNumber.from("10").pow(18))
}

