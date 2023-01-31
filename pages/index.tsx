import Head from "next/head";
import styles from "@/styles/Home.module.css";
import { Web3Storage, File } from "web3.storage";
import Modal from "react-modal";
import { ethers } from "ethers";
import axios from "axios";
import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";

//ABIs
import datasetABI from "../utils/datasetABI.json";
import datasetManagerABI from "../utils/datasetManagerABI.json";

type Dataset = {
  sellerAddress: string;
  title: string;
  description: string;
  price: string;
  datasetSCAddress: string; //Smart contract address of the individual data dao
};

type DatasetDetails = {
  datasetInfo: Dataset;
  buyers: string[];
  cid: string;
  amountCollected: string;
};

export default function Home() {
  const datasetManagerContract =
    "REPLACE_YOUR_DAOMANAGER_SMART_CONTRACT_ADDRESS"; //dataset Manager smart contract address

  //variables
  const [token, setToken] = useState<string>(
    "REPLACE_WITH_YOUR_WEB3STORAGE_API_TOKEN"
  );
  const [isLoading, setIsLoading] = useState(false);
  const [loadedData, setLoadedData] = useState("Loading...");

  const [file, setFile] = useState<null | Buffer>(null);
  const [filename, setFilename] = useState<string>("");
  const [fileDetails, setFileDetails] = useState<string>("");

  const [currentWalletAddress, setCurrentWalletAddress] = useState<string>("");

  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [price, setPrice] = useState("");

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
        datasetManagerContract,
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

  async function createDataset() {
    try {
      //check if user has uploaded a file
      if (file == null) {
        return alert("Please upload a JSON file before proceeding.");
      }

      //check required fields
      if (!title || !description || !price) {
        return alert("Fill all the fields!!");
      }

      setLoadedData("Creating dataset ...Please wait");
      openModal();

      //Use Web3 storage api to store user JSON file
      const storage = new Web3Storage({ token });

      const files = [new File([file], "dataset.json")];
      const cid = await storage.put(files);

      closeModal();

      //call smart contract
      const { ethereum } = window;
      if (ethereum) {
        //set loading modal to open and loading modal text
        setLoadedData("Uploading Dataset data to chain...Please wait");
        openModal();

        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();

        //create Dataset manager contract instance
        const datasetManagerContractInstance = new ethers.Contract(
          datasetManagerContract,
          datasetManagerABI,
          signer
        );

        // (5) call dataset Manager createDataset function from the contract

        // (6) wait for transaction to be mined

        // (7) display alert message
      }

      //call getAllDataSets function to refresh the current list of dataDaoSets
      await getAllDataSets();

      //reset fields back to default values
      setTitle("");
      setDescription("");
      setPrice("");

      setFile(null);
      setFileDetails("");
      setFilename("");

      //close modal
      closeModal();
    } catch (error) {
      console.log(error);
      closeModal();
      alert(`Error: ${error}`);
      return `${error}`;
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

  //upload file function
  function MyDropzone() {
    const onDrop = useCallback((acceptedFiles: any) => {
      const file = acceptedFiles[0];

      //check if file exists
      if (file == null) {
        throw "file error";
      }

      if (file) {
        //set file details into state variables
        setFilename(file.path);
        setFileDetails(`${file.path} - ${file.size} bytes`);
      }

      //read file data with file reader function
      const reader = new FileReader();
      reader.readAsArrayBuffer(file);
      reader.onloadend = function () {
        const arraybufferData = reader.result;

        if (arraybufferData == null || typeof arraybufferData === "string") {
          throw "buffer error";
        }

        const buffer: any = Buffer.from(new Uint8Array(arraybufferData));
        //set file data into state variable
        setFile(buffer);
      };
    }, []);
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
      onDrop,
      multiple: false, //restrict only only 1 file to be choosen
      accept: {
        "text/json": [".json"], //restrict allow only JSON file to be uploaded
      },
    });

    return (
      <div className={styles.dropZoneStyle} {...getRootProps()}>
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>Drop the files here ...</p>
        ) : (
          <p>Drag and drop your JSON file here, or click to select file</p>
        )}
      </div>
    );
  }

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

  //render functions
  function renderAllDatasets(dataset: Dataset) {
    return (
      <div className={styles.createDataContainer}>
        <h4 className={styles.paragraphText}>Title: {dataset.title}</h4>
        <p className={styles.paragraphText}>
          Description: {dataset.description}
        </p>
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
            Back to home page
          </button>
        </div>
      </div>
    );
  }

  useEffect(() => {
    getAllDataSets();
  }, []);

  return (
    <>
      <Head>
        <title>DataDAO</title>

        <meta name="description" content="Generated by create next app" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div
        style={{
          backgroundColor: "white",
          minWidth: "500px",
          paddingBottom: "10px",
        }}
      >
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
              return <div>{`All Data sets`}</div>;
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
              <div className={styles.createDataContainer}>
                <h2 className={styles.createDataset}>Create New Data set </h2>
                <MyDropzone />
                <p style={{ paddingLeft: "20px" }}>{`${fileDetails}`}</p>
                <div style={{ margin: "20px" }}>
                  <div style={{ marginTop: "20px" }}>
                    <label>Title</label>
                    <input
                      type="text"
                      placeholder="Add Title here"
                      onChange={(e) => setTitle(e.target.value)}
                      value={title}
                      style={{
                        padding: "15px",
                        textAlign: "center",
                        display: "block",
                        backgroundColor: "black",
                        color: "white",
                        width: "400px",
                        marginBottom: "10px",
                      }}
                    />
                  </div>

                  <div style={{ marginTop: "20px" }}>
                    <label>Description</label>
                    <input
                      type="text"
                      placeholder="Add Description here"
                      onChange={(e) => setDescription(e.target.value)}
                      value={description}
                      style={{
                        padding: "15px",
                        textAlign: "center",
                        display: "block",
                        backgroundColor: "black",
                        color: "white",
                        width: "400px",
                        marginBottom: "10px",
                      }}
                    />
                  </div>

                  <div style={{ marginTop: "20px" }}>
                    <label>Price (in TFIL)</label>
                    <input
                      type="text"
                      placeholder="Add Price here (TFIL)"
                      onChange={(e) => setPrice(e.target.value)}
                      value={price}
                      style={{
                        padding: "15px",
                        textAlign: "center",
                        display: "block",
                        backgroundColor: "black",
                        color: "white",
                        width: "400px",
                        marginBottom: "10px",
                      }}
                    />
                  </div>

                  <button
                    type="button"
                    className={styles.createDataDAOBtn}
                    onClick={() => createDataset()}
                  >
                    Create a new Data set
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
