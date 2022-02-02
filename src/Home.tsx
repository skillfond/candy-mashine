import { useEffect, useMemo, useState, useCallback } from 'react';
import * as anchor from '@project-serum/anchor';

import styled from 'styled-components';
import { Container, Snackbar, makeStyles, Box,
	List,
	ListItem,
	Typography, 
  Theme,
  AppBar,
  Toolbar, IconButton, Icon, Link, Drawer, Divider, Grid, Accordion, AccordionSummary, AccordionDetails
} from '@material-ui/core';
import MenuIcon from "@material-ui/icons/Menu"
import Twitt from "@material-ui/icons/Twitter"
import You from "@material-ui/icons/YouTube"
import Tel from "@material-ui/icons/Telegram"
import Chevron from "@material-ui/icons/ChevronLeft"
import Paper from '@material-ui/core/Paper';
import Alert from '@material-ui/lab/Alert';
import ExpandMoreIcon from "@material-ui/icons/ExpandMore"
import Fade from "react-reveal/Fade"
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletDialogButton } from '@solana/wallet-adapter-material-ui';
import {
  awaitTransactionSignatureConfirmation,
  CandyMachineAccount,
  CANDY_MACHINE_PROGRAM,
  getCandyMachineState,
  mintOneToken,
} from './candy-machine';
import { AlertState, formatNumber, toDate } from './utils';
import { MintCountdown } from './MintCountdown';
import { GatewayProvider } from '@civic/solana-gateway-react';
import { PublicKey } from '@solana/web3.js';
import { MintButton } from './MintButton';

const ConnectButton = styled(WalletDialogButton)`
  width: 100%;
  height: 60px;
  margin-top: 10px;
  margin-bottom: 5px;
  background: linear-gradient(180deg, #604ae5 0%, #813eee 100%);
  color: white;
  font-size: 16px;
  font-weight: bold;
`;

export interface HomeProps {
  candyMachineId?: anchor.web3.PublicKey;
  connection: anchor.web3.Connection;
  startDate: number;
  txTimeout: number;
  rpcHost: string;
}
const MintContainer = styled.div``

let useStyles = makeStyles((theme: Theme) => ({
	app: {
		width: "100%",
	},
	list: {
		display: "flex",
		flexGrow: 1,
	},
	listD: {
		display: "flex",
		margin: "15px auto !important",
		flexDirection: "column",
		height: "35px",
		width: "100px",
		textAlign: "center",
	},
	drawerHeader: {
		display: "flex",
		alignItems: "center",
		padding: theme.spacing(0, 1),
		...theme.mixins.toolbar,
		justifyContent: "flex-end",
	},
	drawerPaper: {
		width: "100%",
		backgroundColor: "rgba(55,55,55, .6)",
		backdropFilter: "blur(2px)",
	},
	first: {
    minHeight: "100vh",
    backgroundColor: "#000",
		/* background:
			"radial-gradient(circle, rgba(2,1,9,1) 0%, rgba(43,22,49,1) 50%, rgba(2,1,9,1) 100%)", */
		position: "relative",
		borderRadius: "0 !important",
		boxShadow: "none",
		zIndex: -1,
	},
	imgFon: {
		position: "fixed",
		backgroundImage: " url(./img/newfon.png)",
		width: "100%",
		height: "100%",
		backgroundSize: "cover",
		backgroundPosition: "center center",
		backgroundRepeat: "no-repeat",
		zIndex: -1,
	},
	home: {
		background:
			"linear-gradient(180deg,#3e2696 30%,#351e8a 0,#351e8a 70%,#472ea5 0)",
		color: "#FFF",
		height: "100vh",
		borderRadius: "0 !important",
		boxShadow: "none",
		position: "relative",
		[theme.breakpoints.between("xs", "sm")]: {
			minHeight: "100vh",
			height: "100%",
		},
	},
	box: {
		backgroundColor: "#1D0575",
		borderRadius: "25px",
		position: "absolute",
		height: "calc(100vh - 200px)",
		top: "50%",
		transform: "translateY(-50%)",
		width: "calc(100% - 32px)",
		[theme.breakpoints.between("xs", "sm")]: {
			position: "relative",
			height: "100%",
			width: "100%",
			top: "0",
			transform: "none",
		},
	},
	listTedy: {
		height: "calc(100vh - 200px)",
		display: "flex",
		[theme.breakpoints.between("xs", "sm")]: {
			width: "100%",
			height: "100%",
			flexWrap: "wrap",
		},
	},
	imgTedy: {
		height: "100%",
		minWidth: "250px",
		maxWidth: "100%",
		objectFit: "cover",
		borderRadius: `25px 0 0 25px`,
		[theme.breakpoints.between("xs", "sm")]: {
			borderRadius: `25px 25px 0 0`,
			width: "100%",
		},
	},
	listInfo: {
		display: "flex",
		flexDirection: "column",
		minWidth: "300px",
	},
	"listInfoItem:not(:last-child)": {
		marginBottom: "5px",
		borderBottom: "1px solid #6049b0;",
	},
	buttonWall: {
		width: "100%",
		height: "60px",
		marginTop: "10px",
		marginBottom: "5px",
		background: "linear-gradient(180deg, #604ae5 0%, #813eee 100%)",
		color: "white",
		fontSize: "16px",
		fontWeight: "bold",
	},
	container: {
		[theme.breakpoints.down("sm")]: {
			width: "100%",
		},
		[theme.breakpoints.up("md")]: {
			width: "100%",
		},
		[theme.breakpoints.up("lg")]: {
			width: "960px",
		},
		[theme.breakpoints.up("xl")]: {
			width: "1200px",
		},
	},
	botText: {
		textAlign: "center",
		position: "absolute",
		bottom: "50px",
		left: "50%",
		width: "fit-content",
		transform: "translateX(-50%)",
		[theme.breakpoints.between("xs", "sm")]: {
			position: "relative",
			bottom: "0",
			left: "0",
			transform: "none",
			marginTop: "20px",
		},
	},
	paper: {
		background: "#FFF !important",
		position: "relative",
		minHeight: "100vh",
		padding: "50px 0",
		boxShadow: "none !important",
		"&::before": {
			content: '""',
			position: "absolute",
			background: "#FFF url(/img/mint.svg) !important",
			backgroundSize: "cover",
			backgroundPosition: "center",
			backgroundRepeat: "no-repeat",
			top: "2%",
			left: "25%",
			width: "47%",
			height: "98%",
			[theme.breakpoints.between("xs", "sm")]: {
				top: "10%",
				left: "12%",
				width: "80%",
				height: "45%",
			},
			[theme.breakpoints.between("sm", "md")]: {
				top: "0%",
				left: "3%",
				width: "100%",
				height: "90%",
			},
			[theme.breakpoints.up("xl")]: {
				top: "3%",
				left: "25%",
				width: "53%",
				height: "90%",
			},
		},
	},
	paperFo: {
		background: "#39228B !important",
		position: "relative",
		minHeight: "100vh",
		boxShadow: "none !important",
	},
	foot: {
		backgroundColor: "#000 !important",
		borderRadius: "0 !important",
		display: "flex",
		"& > div": {
			display: "flex",
			flexWrap: "wrap",
		},
	},
	imgMint: {
		width: "160px",
		objectFit: "cover",
	},
	textH3: {
		"& > div": {
			marginRight: "auto",
		},
	},
	faq1: {
		height: "100%",
		width: "100%",
		position: "absolute",
	},
	w100: {
		width: "100% !important",
	},
}))

const Home = (props: HomeProps) => {
  const styles = useStyles()
  const [open, setOpen] = useState<boolean>(false)
  const [isUserMinting, setIsUserMinting] = useState(false);
  const [candyMachine, setCandyMachine] = useState<CandyMachineAccount>();
  const [alertState, setAlertState] = useState<AlertState>({
    open: false,
    message: '',
    severity: undefined,
  });

  const rpcUrl = props.rpcHost;
  const wallet = useWallet();

  const anchorWallet = useMemo(() => {
    if (
      !wallet ||
      !wallet.publicKey ||
      !wallet.signAllTransactions ||
      !wallet.signTransaction
    ) {
      return;
    }

    return {
      publicKey: wallet.publicKey,
      signAllTransactions: wallet.signAllTransactions,
      signTransaction: wallet.signTransaction,
    } as anchor.Wallet;
  }, [wallet]);

  
  const refreshCandyMachineState = useCallback(async () => {
    if (!anchorWallet) {
      return;
    }

    if (props.candyMachineId) {
      try {
        const cndy = await getCandyMachineState(
          anchorWallet,
          props.candyMachineId,
          props.connection,
        );
        setCandyMachine(cndy);
      } catch (e) {
        console.log('There was a problem fetching Candy Machine state');
        console.log(e);
      }
    }
  }, [anchorWallet, props.candyMachineId, props.connection]);

  const onMint = async () => {
    try {
      setIsUserMinting(true);
      document.getElementById('#identity')?.click();
      if (wallet.connected && candyMachine?.program && wallet.publicKey) {
        const mintTxId = (
          await mintOneToken(candyMachine, wallet.publicKey)
        )[0];

        let status: any = { err: true };
        if (mintTxId) {
          status = await awaitTransactionSignatureConfirmation(
            mintTxId,
            props.txTimeout,
            props.connection,
            true,
          );
        }

        if (status && !status.err) {
          setAlertState({
            open: true,
            message: 'Congratulations! Mint succeeded!',
            severity: 'success',
          });
        } else {
          setAlertState({
            open: true,
            message: 'Mint failed! Please try again!',
            severity: 'error',
          });
        }
      }
    } catch (error: any) {
      let message = error.msg || 'Minting failed! Please try again!';
      if (!error.msg) {
        if (!error.message) {
          message = 'Transaction Timeout! Please try again.';
        } else if (error.message.indexOf('0x137')) {
          message = `SOLD OUT!`;
        } else if (error.message.indexOf('0x135')) {
          message = `Insufficient funds to mint. Please fund your wallet.`;
        }
      } else {
        if (error.code === 311) {
          message = `SOLD OUT!`;
          window.location.reload();
        } else if (error.code === 312) {
          message = `Minting period hasn't started yet.`;
        }
      }

      setAlertState({
        open: true,
        message,
        severity: 'error',
      });
    } finally {
      setIsUserMinting(false);
    }
  };
  useEffect(() => {
    refreshCandyMachineState();
  }, [
    anchorWallet,
    props.candyMachineId,
    props.connection,
    refreshCandyMachineState
  ]);

  return (
    <>
          <AppBar className={styles.app} position='static'>
				<Toolbar>
					<Box sx={{ mr: "auto", display: { xs: "flex", sm: "none" } }}>
						<IconButton
							size='medium'
							edge='start'
							color='inherit'
							aria-label='menu'
							onClick={() => setOpen(true)}
							>
							<MenuIcon />
						</IconButton>
					</Box>

					<Box sx={{ mr: "auto", display: { xs: "none", sm: "flex" } }}>
						<List className={styles.list}>
							<ListItem>
								<IconButton>
									<img src='/img/logo.png' alt='logo' width={100} height={36} />
								</IconButton>
							</ListItem>
							<ListItem>
								<Link href='#home' style={{ color: "#FFF" }}>
									Home
								</Link>
							</ListItem>
							<ListItem>
								<Link href='#second' style={{ color: "#FFF" }}>
									Second
								</Link>
							</ListItem>
							<ListItem>
								<Link href='#third' style={{ color: "#FFF" }}>
									Third
								</Link>
							</ListItem>
							<ListItem>
								<Link href='#fourth' style={{ color: "#FFF" }}>
									Fourth
								</Link>
							</ListItem>
						</List>
					</Box>
					<Box sx={{ ml: "auto" }}>
						<IconButton color='inherit'>
							<Twitt />
						</IconButton>
						<IconButton color='inherit'>
							<You />
						</IconButton>
						<IconButton color='inherit'>
							<Tel />
						</IconButton>
						<IconButton color='inherit'>
							<Icon className='fab fa-medium' />
						</IconButton>
						<IconButton color='inherit'>
							<Icon className='fab fa-discord' />
						</IconButton>
					</Box>
				</Toolbar>
				<Drawer
					anchor='left'
					open={open}
					onClose={() => setOpen(false)}
					classes={{ paper: styles.drawerPaper }}>
					<div className={styles.drawerHeader}>
						<IconButton onClick={() => setOpen(false)}>
							<Chevron color='secondary' />
						</IconButton>
					</div>
					<Divider />
					<List className={styles.listD}>
						<ListItem>
							<IconButton>
								<img src='/img/logo.png' alt='logo' width={100} height={36} />
							</IconButton>
						</ListItem>
						<ListItem>
							<Link href='#home' style={{ color: "#FFF" }}>
								Home
							</Link>
						</ListItem>
						<ListItem>
							<Link href='#second' style={{ color: "#FFF" }}>
								Second
							</Link>
						</ListItem>
						<ListItem>
							<Link href='#third' style={{ color: "#FFF" }}>
								Third
							</Link>
						</ListItem>
						<ListItem>
							<Link href='#fourth' style={{ color: "#FFF" }}>
								Fourth
							</Link>
						</ListItem>
					</List>
				</Drawer>
			</AppBar>
			<Paper id='home' className={styles.first}>
				<div className={styles.imgFon} />
				<Container maxWidth={false} style={{ paddingTop: "18%" }}>
					<Fade bottom>
						<Typography
							variant='h4'
							component='h1'
							color='secondary'
							style={{ textAlign: "center" }}>
							Solano H1
						</Typography>
					</Fade>
					<Fade bottom>
						<Typography
							variant='h1'
							component='h2'
							color='secondary'
							style={{ textAlign: "center" }}>
							Solano H2
						</Typography>
					</Fade>
				</Container>
			</Paper>
			<Paper id='second' className={styles.home}>
				<Container
					maxWidth={false}
					className={styles.container}
					disableGutters
					style={{
						position: "relative",
						height: "100%",
						padding: "30px 16px",
					}}>
					<Box className={styles.box}>
						<List className={styles.listTedy} disablePadding>
							<ListItem
								disableGutters
								style={{ height: "100%", width: "100%", padding: "0" }}>
								<Fade bottom>
									<img
										src='/img/tedy.jpg'
										alt='tedy'
										className={styles.imgTedy}
									/>
								</Fade>
							</ListItem>
							<ListItem style={{ justifyContent: "center" }}>
								<Fade bottom>
									{!wallet.connected ? (
										<List className={styles.listInfo}>
											<ListItem
												className={styles["listInfoItem:not(:last-child)"]}>
												<ConnectButton>Connect Wallet</ConnectButton>
											</ListItem>
											<ListItem
												className={styles["listInfoItem:not(:last-child)"]}>
												<Typography
													variant='h6'
													component='div'
													color='secondary'
													style={{ display: "flex", width: "100%" }}>
													Price:{" "}
													<span style={{ marginLeft: "auto" }}>1 SOL</span>
												</Typography>
											</ListItem>
											<ListItem
												className={styles["listInfoItem:not(:last-child)"]}>
												<Typography
													variant='h6'
													component='div'
													color='secondary'
													style={{ display: "flex", width: "100%" }}>
													Remaining:{" "}
													<span style={{ marginLeft: "auto" }}>1 SOL</span>
												</Typography>
											</ListItem>
										</List>
									) : (
										candyMachine && (
											<List className={styles.listInfo}>
												<ListItem
													className={styles["listInfoItem:not(:last-child)"]}>
													<MintCountdown
														date={toDate(
															candyMachine?.state.goLiveDate
																? candyMachine?.state.goLiveDate
																: candyMachine?.state.isPresale
																? new anchor.BN(new Date().getTime() / 1000)
																: undefined,
														)}
														style={{ justifyContent: "flex-end" }}
														status={
															!candyMachine?.state?.isActive ||
															candyMachine?.state?.isSoldOut
																? "COMPLETED"
																: candyMachine?.state.isPresale
																? "PRESALE"
																: "LIVE"
														}
													/>
												</ListItem>
												<ListItem
													className={styles["listInfoItem:not(:last-child)"]}>
													<Typography
														variant='h6'
														component='div'
														color='secondary'
														style={{ display: "flex", width: "100%" }}>
														Price:{" "}
														<span style={{ marginLeft: "auto" }}>
															◎{" "}
															{formatNumber.asNumber(
																candyMachine?.state.price!,
															)}
														</span>
													</Typography>
												</ListItem>
												<ListItem
													className={styles["listInfoItem:not(:last-child)"]}>
													<Typography
														variant='h6'
														component='div'
														color='secondary'
														style={{ display: "flex", width: "100%" }}>
														Remaining:{" "}
														<span
															style={{
																marginLeft: "auto",
															}}>{`${candyMachine?.state.itemsRemaining}`}</span>
													</Typography>
												</ListItem>
												<ListItem
													className={styles["listInfoItem:not(:last-child)"]}>
													<MintContainer>
														{candyMachine?.state.isActive &&
														candyMachine?.state.gatekeeper &&
														wallet.publicKey &&
														wallet.signTransaction ? (
															<GatewayProvider
																wallet={{
																	publicKey:
																		wallet.publicKey ||
																		new PublicKey(CANDY_MACHINE_PROGRAM),
																	//@ts-ignore
																	signTransaction: wallet.signTransaction,
																}}
																gatekeeperNetwork={
																	candyMachine?.state?.gatekeeper
																		?.gatekeeperNetwork
																}
																clusterUrl={rpcUrl}
																options={{ autoShowModal: false }}>
																<MintButton
																	candyMachine={candyMachine}
																	isMinting={isUserMinting}
																	onMint={onMint}
																/>
															</GatewayProvider>
														) : (
															<MintButton
																candyMachine={candyMachine}
																isMinting={isUserMinting}
																onMint={onMint}
															/>
														)}
													</MintContainer>
												</ListItem>
											</List>
										)
									)}
								</Fade>
							</ListItem>
						</List>
					</Box>
					<Typography
						variant='h5'
						component='h2'
						className={styles.botText}
						color='secondary'>
						<Fade bottom>
							Please make sure you connect your SOL wallet to Mint.
						</Fade>
					</Typography>
				</Container>
			</Paper>
			<Paper id='third' className={styles.paper}>
				<Container maxWidth={false}>
					<Typography
						variant='h1'
						component='h2'
						style={{ color: "#472ea5", textAlign: "center", fontWeight: 700 }}>
						<Fade bottom>How to mint</Fade>
					</Typography>
					<Fade bottom>
						<Grid container spacing={4}>
							<Grid item xs={12} style={{ zIndex: 0, marginTop: "15px" }}>
								<Grid container justifyContent='center' spacing={6}>
									<Grid item>
										<img
											src='/img/tedy.jpg'
											alt='tedy'
											className={styles.imgMint}
										/>
									</Grid>
									<Grid item>
										<img
											src='/img/tedy.jpg'
											alt='tedy'
											className={styles.imgMint}
										/>
									</Grid>
									<Grid item>
										<img
											src='/img/tedy.jpg'
											alt='tedy'
											className={styles.imgMint}
										/>
									</Grid>
								</Grid>
							</Grid>
						</Grid>
					</Fade>
					<List
						style={{
							minWidth: "350px",
							maxWidth: "625px",
							justifyContent: "left",
							flexDirection: "column",
							margin: "0 auto",
						}}>
						<ListItem
							style={{ flexDirection: "column" }}
							className={styles.textH3}>
							<Fade bottom>
								<Typography
									variant='h6'
									component='h3'
									style={{ color: "#472ea5" }}>
									1. Buy sol from an exchange
								</Typography>{" "}
								<Typography
									variant='body2'
									component='p'
									style={{ color: "#472ea5" }}>
									Buy SOL from your favorite crypto exchange. If you plan on
									converting another crypto into SOL, the easiest way is still
									using an exchange. Here are a few suggestions: Coinbase,
									Kraken, FTX, Binance, Huobi, Bitfinex
								</Typography>
							</Fade>
						</ListItem>
						<ListItem
							style={{ flexDirection: "column" }}
							className={styles.textH3}>
							<Fade bottom style={{ marginRight: "auto" }}>
								<Typography
									variant='h6'
									component='h3'
									style={{ color: "#472ea5" }}>
									2. Transfer from exchange to wallet
								</Typography>{" "}
								<Typography
									variant='body2'
									component='p'
									style={{ color: "#472ea5" }}>
									Transfer funds from your exchange to your wallet. Always
									transfer a bit more than what you plan on spending to pay for
									gas. Solana is practically free but there is still a small gas
									fee.
								</Typography>
							</Fade>
						</ListItem>
						<ListItem
							style={{ flexDirection: "column" }}
							className={styles.textH3}>
							<Fade bottom style={{ marginRight: "auto" }}>
								<Typography
									variant='h6'
									component='h3'
									style={{ color: "#472ea5" }}>
									3. Download and install a sol wallet
								</Typography>{" "}
								<Typography
									variant='body2'
									component='p'
									style={{ color: "#472ea5" }}>
									For Desktop/Laptop, use Phantom on your browser.
								</Typography>
							</Fade>
						</ListItem>
						<ListItem
							style={{ flexDirection: "column" }}
							className={styles.textH3}>
							<Fade bottom style={{ marginRight: "auto" }}>
								<Typography
									variant='h6'
									component='h3'
									style={{ color: "#472ea5" }}>
									4. Mint your NFT
								</Typography>{" "}
								<Typography
									variant='body2'
									component='p'
									style={{ color: "#472ea5" }}>
									On January 16th, 2022, 5PM EST come to our website and mint
									your own Sol Unicorn. There will be a MINT button clearly
									visible on the home page — you won’t miss it.
								</Typography>
							</Fade>
						</ListItem>
					</List>
				</Container>
			</Paper>
			<Paper id='fourth' className={styles.paperFo}>
				<Container maxWidth={"sm"}>
					<Typography
						variant='h1'
						component='h2'
						color='secondary'
						style={{ fontWeight: 700, textAlign: "center", padding: "50px 0" }}>
						<Fade bottom>FAQ</Fade>
					</Typography>
					<List>
						<ListItem>
							<Accordion
								style={{
									width: "100%",
									backgroundColor: "transparent",
									boxShadow: "0px 3px 0px 0px rgb(255, 255, 255, 14%)",
									borderRadius: "0 !important",
								}}>
								<AccordionSummary
									expandIcon={<ExpandMoreIcon color='secondary' />}
									aria-controls='panel1a-content'
									id='panel1a-header'
									color='secondary'>
									<Fade bottom>
										<Typography variant='h5' color='secondary'>
											<Typography
												variant='h5'
												component='span'
												style={{ color: "#e58c18", marginRight: '16px' }}>
												01
											</Typography>
											What is Sol Unicorns 3D?
										</Typography>
									</Fade>
								</AccordionSummary>
								<AccordionDetails>
									<Typography variant='body1' component='p' color='secondary'>
										<Fade bottom>
											Sol Unicorns 3D is a collection of 7,777 unique NFT
											unicorns, each having a set of randomly generated traits
										</Fade>
									</Typography>
								</AccordionDetails>
							</Accordion>
						</ListItem>
						<ListItem>
							<Accordion
								style={{
									width: "100%",
									backgroundColor: "transparent",
									boxShadow: "0px 3px 0px 0px rgb(255, 255, 255, 14%)",
									borderRadius: "0 !important",
								}}>
								<AccordionSummary
									expandIcon={<ExpandMoreIcon color='secondary' />}
									aria-controls='panel1a-content'
									id='panel1a-header'
									color='secondary'>
									<Fade bottom>
										<Typography variant='h5' color='secondary'>
											<Typography
												variant='h5'
												component='span'
												style={{ color: "#e58c18", marginRight: '16px' }}>
												02
											</Typography>
											Why did you choose Solana?
										</Typography>
									</Fade>
								</AccordionSummary>
								<AccordionDetails>
									<Typography variant='body1' component='p' color='secondary'>
										Blazing speed, barely noticeable gas fees, and an
										ever-growing community worldwide!
									</Typography>
								</AccordionDetails>
							</Accordion>
						</ListItem>
						<ListItem>
							<Accordion
								style={{
									width: "100%",
									backgroundColor: "transparent",
									boxShadow: "0px 3px 0px 0px rgb(255, 255, 255, 14%)",
									borderRadius: "0 !important",
								}}>
								<AccordionSummary
									expandIcon={<ExpandMoreIcon color='secondary' />}
									aria-controls='panel1a-content'
									id='panel1a-header'
									color='secondary'>
									<Fade bottom>
										<Typography variant='h5' color='secondary'>
											<Typography
												variant='h5'
												component='span'
												style={{ color: "#e58c18", marginRight: '16px' }}>
												03
											</Typography>
											What wallet can I connect to mint a Sol Unicorns 3D?
										</Typography>
									</Fade>
								</AccordionSummary>
								<AccordionDetails>
									<Typography variant='body1' component='p' color='secondary'>
										You can connect Phantom, Slope, Solflare, Sollet. Our choice
										is the Phantom wallet
									</Typography>
								</AccordionDetails>
							</Accordion>
						</ListItem>
						<ListItem>
							<Accordion
								style={{
									width: "100%",
									backgroundColor: "transparent",
									boxShadow: "0px 3px 0px 0px rgb(255, 255, 255, 14%)",
									borderRadius: "0 !important",
								}}>
								<AccordionSummary
									expandIcon={<ExpandMoreIcon color='secondary' />}
									aria-controls='panel1a-content'
									id='panel1a-header'
									color='secondary'>
									<Fade bottom>
										<Typography variant='h5' color='secondary'>
											<Typography
												variant='h5'
												component='span'
												style={{ color: "#e58c18", marginRight: '16px' }}>
												04
											</Typography>
											How to connect my wallet?
										</Typography>
									</Fade>
								</AccordionSummary>
								<AccordionDetails>
									<Typography variant='body1' component='p' color='secondary'>
										Click on the Connect wallet button if you already have a
										wallet. if not — go to phantom.app and create your wallet
									</Typography>
								</AccordionDetails>
							</Accordion>
						</ListItem>
						<ListItem>
							<Accordion
								style={{
									width: "100%",
									backgroundColor: "transparent",
									boxShadow: "0px 3px 0px 0px rgb(255, 255, 255, 14%)",
									borderRadius: "0 !important",
								}}>
								<AccordionSummary
									expandIcon={<ExpandMoreIcon color='secondary' />}
									aria-controls='panel1a-content'
									id='panel1a-header'
									color='secondary'>
									<Fade bottom>
										<Typography variant='h5' color='secondary'>
											<Typography
												variant='h5'
												component='span'
												style={{ color: "#e58c18", marginRight: '16px' }}>
												05
											</Typography>
											How to mint?
										</Typography>
									</Fade>
								</AccordionSummary>
								<AccordionDetails>
									<Typography variant='body1' component='p' color='secondary'>
										Connect your wallet on our website once minting is on. Then
										click the Mint button
									</Typography>
								</AccordionDetails>
							</Accordion>
						</ListItem>
						<ListItem>
							<Accordion
								style={{
									width: "100%",
									backgroundColor: "transparent",
									boxShadow: "0px 3px 0px 0px rgb(255, 255, 255, 14%)",
									borderRadius: "0 !important",
								}}>
								<AccordionSummary
									expandIcon={<ExpandMoreIcon color='secondary' />}
									aria-controls='panel1a-content'
									id='panel1a-header'
									color='secondary'>
									<Fade bottom>
										<Typography variant='h5' color='secondary'>
											<Typography
												variant='h5'
												component='span'
												style={{ color: "#e58c18", marginRight: '16px' }}>
												06
											</Typography>
											What`s the mint date?
										</Typography>
									</Fade>
								</AccordionSummary>
								<AccordionDetails>
									<Typography variant='body1' component='p' color='secondary'>
										Pre-sale mint for WL applicants starts on January 9th. The
										public mint for everyone else will be held on January 16th
									</Typography>
								</AccordionDetails>
							</Accordion>
						</ListItem>
						<ListItem>
							<Accordion
								style={{
									width: "100%",
									backgroundColor: "transparent",
									boxShadow: "0px 3px 0px 0px rgb(255, 255, 255, 14%)",
									borderRadius: "0 !important",
								}}>
								<AccordionSummary
									expandIcon={<ExpandMoreIcon color='secondary' />}
									aria-controls='panel1a-content'
									id='panel1a-header'
									color='secondary'>
									<Fade bottom>
										<Typography variant='h5' color='secondary'>
											<Typography
												variant='h5'
												component='span'
												style={{ color: "#e58c18", marginRight: '16px' }}>
												07
											</Typography>
											What’s the mint price?
										</Typography>
									</Fade>
								</AccordionSummary>
								<AccordionDetails>
									<Typography variant='body1' component='p' color='secondary'>
										Pre-sale mint cost 0.7 Sol, while the public mint cost 1.5
										Sol
									</Typography>
								</AccordionDetails>
							</Accordion>
						</ListItem>
						<ListItem>
							<Accordion
								style={{
									width: "100%",
									backgroundColor: "transparent",
									boxShadow: "0px 3px 0px 0px rgb(255, 255, 255, 14%)",
									borderRadius: "0 !important",
								}}>
								<AccordionSummary
									expandIcon={<ExpandMoreIcon color='secondary' />}
									aria-controls='panel1a-content'
									id='panel1a-header'
									color='secondary'>
									<Fade bottom>
										<Typography variant='h5' color='secondary'>
											<Typography
												variant='h5'
												component='span'
												style={{ color: "#e58c18", marginRight: '16px' }}>
												08
											</Typography>
											How can I get WL?
										</Typography>
									</Fade>
								</AccordionSummary>
								<AccordionDetails>
									<Typography variant='body1' component='p' color='secondary'>
										Join our discord server to participate in giveaways,
										raffles, and events to get whitelisted
										discord.gg/solunicorns
									</Typography>
								</AccordionDetails>
							</Accordion>
						</ListItem>
						<ListItem>
							<Accordion
								style={{
									width: "100%",
									backgroundColor: "transparent",
									boxShadow: "0px 3px 0px 0px rgb(255, 255, 255, 14%)",
									borderRadius: "0 !important",
								}}>
								<AccordionSummary
									expandIcon={<ExpandMoreIcon color='secondary' />}
									aria-controls='panel1a-content'
									id='panel1a-header'
									color='secondary'>
									<Fade bottom>
										<Typography variant='h5' color='secondary'>
											<Typography
												variant='h5'
												component='span'
												style={{ color: "#e58c18", marginRight: '16px' }}>
												09
											</Typography>
											How should I know how rare is my Unicorn?
										</Typography>
									</Fade>
								</AccordionSummary>
								<AccordionDetails>
									<Typography variant='body1' component='p' color='secondary'>
										Stay tuned for updates in our official Discord group
										discord.gg/solunicorns
									</Typography>
								</AccordionDetails>
							</Accordion>
						</ListItem>
						<ListItem>
							<Accordion
								style={{
									width: "100%",
									backgroundColor: "transparent",
									boxShadow: "0px 3px 0px 0px rgb(255, 255, 255, 14%)",
									borderRadius: "0 !important",
								}}>
								<AccordionSummary
									expandIcon={<ExpandMoreIcon color='secondary' />}
									aria-controls='panel1a-content'
									id='panel1a-header'
									color='secondary'>
									<Fade bottom>
										<Typography variant='h5' color='secondary'>
											<Typography
												variant='h5'
												component='span'
												style={{ color: "#e58c18", marginRight: '16px' }}>
												10
											</Typography>
											What should I do after minting my Sol Unicorn?
										</Typography>
									</Fade>
								</AccordionSummary>
								<AccordionDetails>
									<Typography variant='body1' component='p' color='secondary'>
										To get maximum benefits, you may want to hold it for extra
										rewards and in-game perks.
									</Typography>
								</AccordionDetails>
							</Accordion>
						</ListItem>
						<ListItem>
							<Accordion
								style={{
									width: "100%",
									backgroundColor: "transparent",
									boxShadow: "0px 3px 0px 0px rgb(255, 255, 255, 14%)",
									borderRadius: "0 !important",
								}}>
								<AccordionSummary
									expandIcon={<ExpandMoreIcon color='secondary' />}
									aria-controls='panel1a-content'
									id='panel1a-header'
									color='secondary'>
									<Fade bottom>
										<Typography variant='h5' color='secondary'>
											<Typography
												variant='h5'
												component='span'
												style={{ color: "#e58c18", marginRight: '16px' }}>
												11
											</Typography>
											Why should I hold Sol Unicorns 3D?
										</Typography>
									</Fade>
								</AccordionSummary>
								<AccordionDetails>
									<Typography variant='body1' component='p' color='secondary'>
										Holding rewards you perks such as P2E game, NFT & Token
										drops, priority access for future NFT collections, and more.
									</Typography>
								</AccordionDetails>
							</Accordion>
						</ListItem>
					</List>
				</Container>
			</Paper>
			<footer>
				<Paper className={styles.foot}>
					<Container maxWidth={false}>
						<List className={styles.list} style={{ flexGrow: 0 }}>
							<ListItem>
								<Link href='#home' style={{ color: "#FFF" }}>
									Home
								</Link>
							</ListItem>
							<ListItem>
								<Link href='#second' style={{ color: "#FFF" }}>
									Second
								</Link>
							</ListItem>
							<ListItem>
								<Link href='#third' style={{ color: "#FFF" }}>
									Third
								</Link>
							</ListItem>
							<ListItem>
								<Link href='#fourth' style={{ color: "#FFF" }}>
									Fourth
								</Link>
							</ListItem>
						</List>
						<Box sx={{ ml: "auto", mt: 1 }}>
							<IconButton color='secondary'>
								<Twitt />
							</IconButton>
							<IconButton color='secondary'>
								<You />
							</IconButton>
							<IconButton color='secondary'>
								<Tel />
							</IconButton>
							<IconButton color='secondary'>
								<Icon className='fab fa-medium' />
							</IconButton>
							<IconButton color='secondary'>
								<Icon className='fab fa-discord' />
							</IconButton>
						</Box>
					</Container>
				</Paper>
			</footer>
      <Snackbar
        open={alertState.open}
        autoHideDuration={6000}
        onClose={() => setAlertState({ ...alertState, open: false })}
      >
        <Alert
          onClose={() => setAlertState({ ...alertState, open: false })}
          severity={alertState.severity}
        >
          {alertState.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default Home;
