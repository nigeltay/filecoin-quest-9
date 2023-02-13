import Head from "next/head";
import styles from "@/styles/Home.module.css";
import Modal from "react-modal";
import { ethers } from "ethers";
import axios from "axios";
import Link from "next/link";
import { useEffect, useState } from "react";
import Router from "next/router";

//ABIs
import datasetABI from "../utils/datasetABI.json";
import datasetManagerABI from "../utils/datasetManagerABI.json";
import { Dataset, DatasetDetails } from ".";

export default function ViewAllDataSets() {
  const datasetManagerContract = process.env.NEXT_PUBLIC_SMART_CONTRACT_ADDRESS; //dataset Manager smart contract address
  //variables

  const [token, setToken] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadedData, setLoadedData] = useState("Loading...");

  const [currentWalletAddress, setCurrentWalletAddress] = useState<string>("");

  const [allDatasets, setallDatasets] = useState<Dataset[]>([]);
  const [activeDatasetDetails, setDatasetDetails] =
    useState<DatasetDetails | null>(null);

  function openModal() {
    setIsLoading(true);
  }

  function closeModal() {
    setIsLoading(false);
  }

  async function getAllDataSets() {
    const { ethereum } = window;

    // Check if MetaMask is installed
    if (!ethereum) {
      return "Make sure you have MetaMask Connected!";
    }

    // Get user Metamask Ethereum wallet address
    const accounts = await ethereum.request({
      method: "eth_requestAccounts",
    });
    // Get the first account address
    const walletAddr = accounts[0];

    //set to variable to store current wallet address
    setCurrentWalletAddress(walletAddr);

    if (ethereum) {
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();

      //create contract instance
      const datasetManagerContractInstance = new ethers.Contract(
        datasetManagerContract as string,
        datasetManagerABI,
        signer
      );

      //(1) call the getDatasetList function from the contract to get all Data Dao contract addresses

      //(2) call getDatasetInformation function from contract to retrieve all information on each Data DAO

      // declare new array
      let newDatasets = [];

      //(3) iterate and loop through the data retrieve from the blockchain

      //(4) set data into react state variable
    }
  }

  async function buyDataSet(dataset: DatasetDetails) {
    try {
      setLoadedData("Making purchase in progress ...Please wait");
      openModal();

      //call smart contract
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();

        // (8) create Dataset contract instance

        // (9) call buyDataSet function from the dataset smart contract

        // (10)  wait for transaction to be mined

        // (11) display alert message

        //call getActiveDatasetDetails function to get updated data
        await getActiveDatasetDetails(dataset.datasetInfo);

        //close modal
        closeModal();
      }
    } catch (error) {
      console.log(error);
      closeModal();
      alert(`Error: ${error}`);
      return `${error}`;
    }
  }

  async function getActiveDatasetDetails(dataset: Dataset) {
    const { ethereum } = window;

    if (ethereum) {
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();

      //create contract instance
      const datasetContractInstance = new ethers.Contract(
        dataset.datasetSCAddress,
        datasetABI,
        signer
      );

      const datasetInformation =
        await datasetContractInstance.getDetailInformation();

      setDatasetDetails({
        datasetInfo: dataset,
        buyers: datasetInformation._buyers,
        cid: datasetInformation._CID,
        amountCollected: (
          datasetInformation._amountStored / 1000000000000000000
        ) //ethers has 18 decimal places
          .toString(),
      });
    }
  }

  async function withdrawFunds(dataset: DatasetDetails) {
    try {
      setLoadedData("Withdrawing funds in progress ...Please wait");
      openModal();

      //call smart contract
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();

        //create Dataset contract instance
        const datasetContractInstance = new ethers.Contract(
          dataset.datasetInfo.datasetSCAddress,
          datasetABI,
          signer
        );

        // (12) call withdrawFunds function from the dataset smart contract

        // (13)  wait for transaction to be mined

        // (14) display alert message
      }
      //call getActiveDatasetDetails function to get updated data
      await getActiveDatasetDetails(dataset.datasetInfo);

      //close modal
      closeModal();
    } catch (error) {
      console.log(error);
      closeModal();
      alert(`Error: ${error}`);
      return `${error}`;
    }
  }

  async function downloadDataSet(dataset: DatasetDetails) {
    let config: any = {
      method: "get",
      url: `https://${dataset.cid}.ipfs.w3s.link/dataset.json`,
      headers: {},
    };
    //get dataset json file from web3 stoage via axios
    const axiosResponse = await axios(config);
    const dataObject = axiosResponse.data;

    const json = JSON.stringify(dataObject, null, 2);
    const blob = new Blob([json], { type: "application/json" }); //convert json data to file blob object

    const downloadLink = document.createElement("a");
    downloadLink.href = URL.createObjectURL(blob);
    downloadLink.download = `dataset.json`; //File name
    downloadLink.click(); //Download file on click
  }

  //render functions
  function renderAllDatasets(dataset: Dataset) {
    return (
      <div className={styles.createDataContainer}>
        <h4 className={styles.paragraphText}>Title: {dataset.title}</h4>
        <p className={styles.paragraphText}>
          Description: {dataset.description}
        </p>
        <p className={styles.paragraphText}>Category: {dataset.category}</p>
        <p className={styles.paragraphText}>Price: {dataset.price} TFIL</p>
        <p className={styles.paragraphText}>
          Seller Address: {dataset.sellerAddress}
        </p>
        <button
          className={styles.viewDataDaoBtn}
          onClick={() => {
            getActiveDatasetDetails(dataset);
          }}
        >
          View Details
        </button>
      </div>
    );
  }

  function renderActiveDataset(dataset: DatasetDetails) {
    //check if current user is the seller

    let isSeller =
      dataset.datasetInfo.sellerAddress.toLowerCase() === currentWalletAddress;

    //check if current user has made a purchase
    let hasCurrentBuyerMadeAPurchase = dataset.buyers.some(
      (buyer) => buyer.toLowerCase() === currentWalletAddress
    );

    return (
      <div className={styles.activeDataDaoContainer}>
        <div>
          <h1 className={styles.paragraphText}>{dataset.datasetInfo.title} </h1>
          <div className={styles.paragraphText}>
            {" "}
            Description: {dataset.datasetInfo.description}
          </div>
          <div className={styles.paragraphText}>
            {" "}
            Category: {dataset.datasetInfo.category}
          </div>
          <p className={styles.paragraphText}>
            Seller : {dataset.datasetInfo.sellerAddress}{" "}
          </p>
          <p className={styles.paragraphText}>
            Price : {dataset.datasetInfo.price}
            {" TFIL"}
          </p>

          {isSeller ? (
            <p className={styles.paragraphText}>
              Amount that can be withdrawn : {dataset.amountCollected}
              {" TFIL"}
            </p>
          ) : null}

          <p className={styles.paragraphText}>
            No of buyers: {dataset.buyers.length}{" "}
          </p>

          <div style={{ display: "flex" }}>
            <p className={styles.paragraphText}>
              Data DAO Smart contract address:{" "}
            </p>
            <p className={styles.hyperlinkText}>
              <Link
                href={`https://hyperspace.filfox.info/en/address/${dataset.datasetInfo.datasetSCAddress}`}
                target="_blank"
              >
                {dataset.datasetInfo.datasetSCAddress}
              </Link>
            </p>
          </div>
          {!isSeller && !hasCurrentBuyerMadeAPurchase ? (
            <button
              className={styles.placeOrderBtn}
              onClick={() => buyDataSet(dataset)}
            >
              Buy Data Dao Set
            </button>
          ) : null}

          {!isSeller && hasCurrentBuyerMadeAPurchase ? (
            <button
              className={styles.downloadDataDaoBtn}
              onClick={() => downloadDataSet(dataset)}
            >
              Download Data set
            </button>
          ) : null}

          {isSeller && parseFloat(dataset.amountCollected) > 0 ? (
            <button
              className={styles.withdrawFundsBtn}
              onClick={() => withdrawFunds(dataset)}
            >
              Withdraw Funds
            </button>
          ) : null}

          <button
            className={styles.backBtn}
            onClick={() => setDatasetDetails(null)}
          >
            Go back to Data sets page
          </button>
        </div>
      </div>
    );
  }

  async function getWeb3StorageAPIkey() {
    const key = process.env.NEXT_PUBLIC_WEB3_STORAGE_API_KEY;
    if (key != undefined) {
      setToken(key);
    }
  }

  useEffect(() => {
    getAllDataSets();
    getWeb3StorageAPIkey();
  }, []);

  const customStyles = {
    content: {
      top: "50%",
      left: "50%",
      right: "auto",
      bottom: "auto",
      marginRight: "-50%",
      transform: "translate(-50%, -50%)",
      color: "black ",
    },
  };

  return (
    <>
      <div className={styles.bottomBody}>
        <div className={styles.topPanel}>
          <div className={styles.walletAddress}>{`Data DAO Application`}</div>
          <div className={styles.walletAddress}>
            {`Wallet Address: ${currentWalletAddress}`}
          </div>
        </div>
        <Modal
          isOpen={isLoading}
          //onRequestClose={closeModal}
          style={customStyles}
          contentLabel="Example Modal"
        >
          {loadedData}
        </Modal>

        <h2 className={styles.allDatasets}>
          {(() => {
            if (activeDatasetDetails == null) {
              return <div style={{ color: "white" }}>{`All Data sets`}</div>;
            } else {
              return <div>{``}</div>;
            }
          })()}
        </h2>

        <div>
          {activeDatasetDetails != null ? (
            renderActiveDataset(activeDatasetDetails)
          ) : (
            <>
              <div>
                {allDatasets.map((dataset) => renderAllDatasets(dataset))}
              </div>
            </>
          )}
        </div>
        {activeDatasetDetails != null ? (
          <button
            className={styles.backToCreatePage}
            style={{ marginLeft: "30px" }}
            onClick={() => {
              Router.push("/");
            }}
          >
            Back to create Data Dao page
          </button>
        ) : (
          <>
            <button
              className={styles.backToCreatePage}
              style={{ marginLeft: "10px" }}
              onClick={() => {
                Router.push("/");
              }}
            >
              Back to create Data Dao page
            </button>
          </>
        )}
        <div></div>
      </div>
    </>
  );
}
