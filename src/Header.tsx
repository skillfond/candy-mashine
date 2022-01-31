import * as anchor from '@project-serum/anchor';

import Typography from '@material-ui/core/Typography';
import { Box, Container, List, ListItem, makeStyles, Paper } from '@material-ui/core';
import { MintCountdown } from './MintCountdown';
import { toDate, formatNumber } from './utils';
import { CandyMachineAccount, CANDY_MACHINE_PROGRAM } from './candy-machine';
import styled from 'styled-components';
import { MintButton } from './MintButton';
import { GatewayProvider } from '@civic/solana-gateway-react';
import { PublicKey } from '@solana/web3.js';

type HeaderProps = {
  candyMachine?: CandyMachineAccount;
  rpcUrl: any
  wallet: any
  isUserMinting: any
  onMint: any
};
const MintContainer = styled.div``;
const useStyles = makeStyles((theme) => ({
	home: {
		background:
			"linear-gradient(180deg,#3e2696 30%,#351e8a 0,#351e8a 70%,#472ea5 0)",
		color: "#FFF",
		height: "100vh",
		borderRadius: "0",
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
}))

export const Header = ({ candyMachine, rpcUrl, wallet, isUserMinting, onMint }: HeaderProps) => {
  const styles = useStyles()
  return (
    <>
      {candyMachine && (
        <Paper className={styles.home}>
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
                <img
                  src='/img/tedy.jpg'
                  alt='tedy'
                  className={styles.imgTedy}
                />
              </ListItem>
              <ListItem style={{ justifyContent: "center" }}>
                <List className={styles.listInfo}>
                  <ListItem className={styles["listInfoItem:not(:last-child)"]}>
                  <MintCountdown
          date={toDate(candyMachine?.state.goLiveDate
            ? candyMachine?.state.goLiveDate
            : candyMachine?.state.isPresale
              ? new anchor.BN(new Date().getTime() / 1000)
              : undefined
        )}
          style={{ justifyContent: 'flex-end' }}
          status={
            !candyMachine?.state?.isActive || candyMachine?.state?.isSoldOut
              ? 'COMPLETED'
              : candyMachine?.state.isPresale ?  'PRESALE' : 'LIVE'
          }
        />
                  </ListItem>
                  <ListItem className={styles["listInfoItem:not(:last-child)"]}>
                    <Typography
                      variant='h6'
                      component='div'
                      style={{ display: "flex", width: "100%" }}>
                      Price: <span style={{ marginLeft: "auto" }}>◎ {formatNumber.asNumber(candyMachine?.state.price!)}</span>
                    </Typography>
                  </ListItem>
                  <ListItem className={styles["listInfoItem:not(:last-child)"]}>
                    <Typography
                      variant='h6'
                      component='div'
                      style={{ display: "flex", width: "100%" }}>
                      Remaining:{" "}
                      <span style={{ marginLeft: "auto" }}>{`${candyMachine?.state.itemsRemaining}`}</span>
                    </Typography>
                  </ListItem>
                  <ListItem className={styles["listInfoItem:not(:last-child)"]}>
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
                      candyMachine?.state?.gatekeeper?.gatekeeperNetwork
                    }
                    clusterUrl={rpcUrl}
                    options={{ autoShowModal: false }}
                  >
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
              </ListItem>
            </List>
          </Box>
          <Typography variant='h5' component='h2' className={styles.botText}>
            Please make sure you connect your SOL wallet to Mint.
          </Typography>
        </Container>
      </Paper>
        )}
        
    </>
  );
};
