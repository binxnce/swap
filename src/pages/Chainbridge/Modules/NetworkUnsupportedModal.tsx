import '../styles.scss';

import {
  Button,
  ExclamationCircleInverseSvg,
  Typography,
} from "@chainsafe/common-components";
import { ITheme, createStyles, makeStyles } from "@chainsafe/common-theme";

import CustomModal from "../Components/Custom/CustomModal";
import React from "react";

const useStyles = makeStyles(({ constants, palette }: ITheme) =>
  createStyles({
    root: {
      width: "100%",
    },
    inner: {
      width: "100% !important",
      maxWidth: "unset !important",
      borderRadius: "24px",
      display: "flex",
      flexDirection: "row",
      padding: `${constants.generalUnit * 6}px ${constants.generalUnit * 7}px`,
    },
    heading: {
      marginBottom: constants.generalUnit,
      color: '#0E1130',
    },
    bodytext: {
      color: '#0E1130',
    },
    icon: {
      height: 20,
      width: 20,
      marginTop: constants.generalUnit * 0.8,
      marginRight: constants.generalUnit * 2,
      fill: '#2662FF',
    },
    buttons: {
      display: "flex",
      flexDirection: "row",
      marginTop: constants.generalUnit * 5,
      "& > *": {
        textDecoration: "none",
        marginRight: constants.generalUnit,
      },
    },
    button: {
      backgroundColor: '#2662FF',
      color: '#fff',
      paddingLeft: '1rem',
      paddingRight: '1rem',
      borderRadius: '100px',
      height: '50px',
      "&:hover": {
        borderColor: palette.additional["gray"][8],
        backgroundColor: '#2662FF',
        color: palette.common.white.main,
      },
    },
  })
);

const networkName = (id: any) => {
  switch (Number(id)) {
    case 1:
      return "Mainnet";
    case 3:
      return "Ropsten";
    case 4:
      return "Rinkeby";
    case 5:
      return "Goerli";
    case 6:
      return "Kotti";
    case 42:
      return "Kovan";
    case 61:
      return "Ethereum Classic - Mainnet";
    default:
      return "Other";
  }
};

interface INetworkUnsupportedModalProps {
  open: boolean;
  network: number | undefined;
  supportedNetworks: number[];
}

const NetworkUnsupportedModal: React.FC<INetworkUnsupportedModalProps> = ({
  open,
  network,
  supportedNetworks,
}) => {
  const classes = useStyles();

  return (
    <CustomModal
      className={classes.root}
      injectedClass={{
        inner: classes.inner,
      }}
      active={open}
    >
      <section>
        <ExclamationCircleInverseSvg className={classes.icon} />
      </section>
      <section>
        <Typography className={classes.heading} variant="h3" component="h3">
          Network Unsupported
        </Typography>
        <Typography component="p" variant="body1" className={classes.bodytext}>
          This app does not currently support transfers on{" "}
          {networkName(network)}. Please change networks from within your
          browser wallet.
        </Typography>
        <br />
        <Typography component="p" variant="body1" className={classes.bodytext}>
          This app is configured to work on{" "}
          {supportedNetworks.map(
            (n, i) =>
              `${networkName(n)}${i < supportedNetworks.length - 1 ? ", " : ""}`
          )}{" "}
          networks
        </Typography>
        <section className={classes.buttons}>
          <a
            rel="noopener noreferrer"
            href="https://discord.com/invite/n2U6x9c"
            target="_blank"
          >
            <Button className={classes.button} variant="outline">
              Ask a question on Discord
            </Button>
          </a>
        </section>
      </section>
    </CustomModal>
  );
};

export default NetworkUnsupportedModal;