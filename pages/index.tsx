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

type DataDao = {
  sellerAddress: string;
  title: string;
  description: string;
  price: string;
  dataDaoSCAddress: string; //Smart contract address of the individual data dao
};

type DataDaoDetails = {
  dataDaoInfo: DataDao;
  buyers: string[];
  cid: string;
  amountCollected: string;
};

export default function Home() {
  const dataDAOManagerContract = "0xdF652F24d243f22D12882C9f09ebeFbF55d5e7c1"; //dataDAO Manager smart contract address

  //variables
  const [token, setToken] = useState<string>(
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweGU5N0RDODlFQ0E3NEUxZEVCNDhDYmY4ZjVCODAwRWRCODM1MjlBOEQiLCJpc3MiOiJ3ZWIzLXN0b3JhZ2UiLCJpYXQiOjE2NzI3MTY3MzQ1MDcsIm5hbWUiOiJteVRva2VuIn0.9ycmydenwBvA1a24WGLn4E3kH2C5UYgChY9B4-_ZxJU"
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

  const [allDataDao, setAllDataDao] = useState<DataDao[]>([]);
  const [activeDataDaoDetails, setDataDaoDetails] =
    useState<DataDaoDetails | null>(null);

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
      const dataDAOManagerContractInstance = new ethers.Contract(
        dataDAOManagerContract,
        datasetManagerABI,
        signer
      );

      //(1) call the getDataDaoList function from the contract to get all Data Dao contract addresses
      const allDataDaoAddresses =
        await dataDAOManagerContractInstance.getDatasetList();
      //(2) call getDataDaoInformation function from contract to retrieve all information on each Data DAO
      const allDataDaoData =
        await dataDAOManagerContractInstance.getDatasetInformation(
          allDataDaoAddresses
        );
      // declare new array
      let newDataDAOs = [];

      //(3) iterate and loop through the data retrieve from the blockchain
      for (let i = 0; i < allDataDaoData.sellerAddress.length; i++) {
        let sellerAddress: string = allDataDaoData.sellerAddress[i];
        let title: string = allDataDaoData.title[i];
        let description: string = allDataDaoData.description[i];
        let price = allDataDaoData.price[i];
        let dataDaoSCAddress: string = allDataDaoAddresses[i];

        let newDataDao: DataDao = {
          sellerAddress,
          title,
          description,
          price: (price / 1000000000000000000).toString(), //ethers/TFIL has 18 decimal places
          dataDaoSCAddress,
        };
        //add into array
        newDataDAOs.push(newDataDao);
      }
      //(4) set data into react state variable
      setAllDataDao(newDataDAOs);
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
        setLoadedData("Uploading DataDAO data to chain...Please wait");
        openModal();

        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();

        //create DataDAO manager contract instance
        const dataDAOManagerContractInstance = new ethers.Contract(
          dataDAOManagerContract,
          datasetManagerABI,
          signer
        );

        // (5) call dataDAO Manager create dataDAO function from the contract
        let { hash } = await dataDAOManagerContractInstance.createDataset(
          title,
          description,
          ethers.utils.parseEther(price.toString()),
          cid
        );
        // (6) wait for transaction to be mined
        await provider.waitForTransaction(hash);
        // (7) display alert message
        alert(`Transaction sent! Hash: ${hash}`);
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

  async function buyDataSet(dataDao: DataDaoDetails) {
    try {
      setLoadedData("Making purchase in progress ...Please wait");
      openModal();

      //call smart contract
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();

        // (8) create DataDAO contract instance
        const dataDAOContractInstance = new ethers.Contract(
          dataDao.dataDaoInfo.dataDaoSCAddress,
          datasetABI,
          signer
        );
        // (9) call buyDataSet function from the dataDao smart contract
        let { hash } = await dataDAOContractInstance.buyDataSet({
          value: ethers.utils.parseEther(dataDao.dataDaoInfo.price), //amount to transfer to smart contract to hold
        });
        // (10)  wait for transaction to be mined
        await provider.waitForTransaction(hash);
        // (11) display alert message
        alert(`Transaction sent! Hash: ${hash}`);
        //call getActiveDataDaoDetails function to get updated data
        await getActiveDataDaoDetails(dataDao.dataDaoInfo);

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

  async function withdrawFunds(dataDao: DataDaoDetails) {
    try {
      setLoadedData("Withdrawing funds in progress ...Please wait");
      openModal();

      //call smart contract
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();

        //create DataDAO contract instance
        const dataDAOContractInstance = new ethers.Contract(
          dataDao.dataDaoInfo.dataDaoSCAddress,
          datasetABI,
          signer
        );

        // (12) call withdrawFunds function from the dataDao smart contract
        let { hash } = await dataDAOContractInstance.withdrawFunds();
        // (13)  wait for transaction to be mined
        await provider.waitForTransaction(hash);
        // (14) display alert message
        alert(`Transaction sent! Hash: ${hash}`);
      }
      //call getActiveDataDaoDetails function to get updated data
      await getActiveDataDaoDetails(dataDao.dataDaoInfo);

      //close modal
      closeModal();
    } catch (error) {
      console.log(error);
      closeModal();
      alert(`Error: ${error}`);
      return `${error}`;
    }
  }

  async function downloadDataSet(dataDao: DataDaoDetails) {
    let config: any = {
      method: "get",
      url: `https://${dataDao.cid}.ipfs.w3s.link/dataset.json`,
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

  async function getActiveDataDaoDetails(dataDao: DataDao) {
    const { ethereum } = window;

    if (ethereum) {
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();

      //create contract instance
      const dataDAOContractInstance = new ethers.Contract(
        dataDao.dataDaoSCAddress,
        datasetABI,
        signer
      );

      const dataDaoInfo = await dataDAOContractInstance.getDetailInformation();

      setDataDaoDetails({
        dataDaoInfo: dataDao,
        buyers: dataDaoInfo._buyers,
        cid: dataDaoInfo._CID,
        amountCollected: (dataDaoInfo._amountStored / 1000000000000000000) //ethers has 18 decimal places
          .toString(),
      });
    }
  }

  //render functions
  function renderAllDataDaos(dataDao: DataDao) {
    return (
      <div className={styles.createDataContainer}>
        <h4 className={styles.paragraphText}>Title: {dataDao.title}</h4>
        <p className={styles.paragraphText}>
          Description: {dataDao.description}
        </p>
        <p className={styles.paragraphText}>Price: {dataDao.price} TFIL</p>
        <p className={styles.paragraphText}>
          Seller Address: {dataDao.sellerAddress}
        </p>
        <button
          className={styles.viewDataDaoBtn}
          onClick={() => {
            getActiveDataDaoDetails(dataDao);
          }}
        >
          View Details
        </button>
      </div>
    );
  }

  function renderActiveDataDao(dataDao: DataDaoDetails) {
    //check if current user is the seller

    let isSeller =
      dataDao.dataDaoInfo.sellerAddress.toLowerCase() === currentWalletAddress;

    //check if current user has made a purchase
    let hasCurrentBuyerMadeAPurchase = dataDao.buyers.some(
      (buyer) => buyer.toLowerCase() === currentWalletAddress
    );

    return (
      <div className={styles.activeDataDaoContainer}>
        <div>
          <h1 className={styles.paragraphText}>{dataDao.dataDaoInfo.title} </h1>
          <div className={styles.paragraphText}>
            {" "}
            Description: {dataDao.dataDaoInfo.description}
          </div>
          <p className={styles.paragraphText}>
            Seller : {dataDao.dataDaoInfo.sellerAddress}{" "}
          </p>
          <p className={styles.paragraphText}>
            Price : {dataDao.dataDaoInfo.price}
            {" TFIL"}
          </p>

          {isSeller ? (
            <p className={styles.paragraphText}>
              Amount that can be withdrawn : {dataDao.amountCollected}
              {" TFIL"}
            </p>
          ) : null}

          <p className={styles.paragraphText}>
            No of buyers: {dataDao.buyers.length}{" "}
          </p>

          <div style={{ display: "flex" }}>
            <p className={styles.paragraphText}>
              Data DAO Smart contract address:{" "}
            </p>
            <p className={styles.hyperlinkText}>
              <Link
                href={`https://hyperspace.filfox.info/en/address/${dataDao.dataDaoInfo.dataDaoSCAddress}`}
                target="_blank"
              >
                {dataDao.dataDaoInfo.dataDaoSCAddress}
              </Link>
            </p>
          </div>
          {!isSeller && !hasCurrentBuyerMadeAPurchase ? (
            <button
              className={styles.placeOrderBtn}
              onClick={() => buyDataSet(dataDao)}
            >
              Buy Data Dao Set
            </button>
          ) : null}

          {!isSeller && hasCurrentBuyerMadeAPurchase ? (
            <button
              className={styles.downloadDataDaoBtn}
              onClick={() => downloadDataSet(dataDao)}
            >
              Download Data set
            </button>
          ) : null}

          {isSeller && parseFloat(dataDao.amountCollected) > 0 ? (
            <button
              className={styles.withdrawFundsBtn}
              onClick={() => withdrawFunds(dataDao)}
            >
              Withdraw Funds
            </button>
          ) : null}

          <button
            className={styles.backBtn}
            onClick={() => setDataDaoDetails(null)}
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
            if (activeDataDaoDetails == null) {
              return <div>{`All Data sets`}</div>;
            } else {
              return <div>{``}</div>;
            }
          })()}
        </h2>

        <div>
          {activeDataDaoDetails != null ? (
            renderActiveDataDao(activeDataDaoDetails)
          ) : (
            <>
              <div>
                {allDataDao.map((dataDao) => renderAllDataDaos(dataDao))}
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
