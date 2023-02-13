import Head from "next/head";
import styles from "@/styles/Home.module.css";
import { Web3Storage, File } from "web3.storage";
import Modal from "react-modal";
import { ethers } from "ethers";
import { useEffect, useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import Router from "next/router";

//ABIs
import datasetManagerABI from "../utils/datasetManagerABI.json";

export type Dataset = {
  sellerAddress: string;
  title: string;
  description: string;
  price: string;
  category: string;
  datasetSCAddress: string; //Smart contract address of the individual data dao
};

export type DatasetDetails = {
  datasetInfo: Dataset;
  buyers: string[];
  cid: string;
  amountCollected: string;
};

type Category =
  | "Investment"
  | "Research"
  | "Gaming & Sports"
  | "Retail"
  | "Philanthropic";

export default function Home() {
  //variables
  const [datasetManagerContract, setSmartContractAddress] =
    useState<string>("");

  const [token, setToken] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadedData, setLoadedData] = useState("Loading...");

  const [file, setFile] = useState<null | Buffer>(null);
  const [filename, setFilename] = useState<string>("");
  const [fileDetails, setFileDetails] = useState<string>("");

  const [currentWalletAddress, setCurrentWalletAddress] = useState<string>("");

  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState<Category | null>(null);

  const [allDatasets, setallDatasets] = useState<Dataset[]>([]);
  const [activeDatasetDetails, setDatasetDetails] =
    useState<DatasetDetails | null>(null);

  function openModal() {
    setIsLoading(true);
  }

  function closeModal() {
    setIsLoading(false);
  }

  async function connectWallet() {
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

      if (category == null) {
        return alert("Please select a category.");
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
        let { hash } = await datasetManagerContractInstance.createDataset(
          title,
          description,
          ethers.utils.parseEther(price.toString()),
          cid,
          category
        );
        // (6) wait for transaction to be mined
        await provider.waitForTransaction(hash);
        // (7) display alert message
        alert(`Transaction sent! Hash: ${hash}`);
      }

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

  async function getWeb3StorageAPIkey() {
    const key = process.env.NEXT_PUBLIC_WEB3_STORAGE_API_KEY;
    if (key != undefined) {
      setToken(key);
    }
  }

  async function getSmartContractAddress() {
    const addr = process.env.NEXT_PUBLIC_SMART_CONTRACT_ADDRESS;
    if (addr != undefined) {
      setSmartContractAddress(addr);
    }
  }

  useEffect(() => {
    getWeb3StorageAPIkey();
    getSmartContractAddress();
    connectWallet();
  }, []);

  return (
    <>
      <Head>
        <title>DataDAO</title>

        <meta name="description" content="Generated by create next app" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
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

        <h2 className={styles.allDatasets}>{`Create a Data Dao `}</h2>

        <div>
          {
            <>
              <div style={{ display: "flex" }}>
                <div>
                  <div className={styles.createDataContainer}>
                    <h3 className={styles.createDataset}>
                      What kind of Data Dao will you build, please select a
                      category below.
                    </h3>
                    <div
                      className={styles.category}
                      onClick={() => setCategory("Investment")}
                    >
                      <p
                        style={{
                          paddingLeft: "20px",
                          color: "lightblue",
                        }}
                      >{`Investment`}</p>
                      <p
                        style={{ paddingLeft: "20px", color: "white" }}
                      >{`Invest together as an asset class`}</p>
                    </div>

                    <div
                      className={styles.category}
                      onClick={() => setCategory("Research")}
                    >
                      <p
                        style={{ paddingLeft: "20px", color: "red" }}
                      >{`Research`}</p>
                      <p
                        style={{ paddingLeft: "20px", color: "white" }}
                      >{`Coordinate Research and Development`}</p>
                    </div>

                    <div
                      className={styles.category}
                      onClick={() => setCategory("Gaming & Sports")}
                    >
                      <p
                        style={{ paddingLeft: "20px", color: "green" }}
                      >{`Gaming & Sports`}</p>
                      <p
                        style={{ paddingLeft: "20px", color: "white" }}
                      >{`Invest together in your favoruite games and sports team`}</p>
                    </div>

                    <div
                      className={styles.category}
                      onClick={() => setCategory("Retail")}
                    >
                      <p
                        style={{ paddingLeft: "20px", color: "orange" }}
                      >{`Retail`}</p>
                      <p
                        style={{ paddingLeft: "20px", color: "white" }}
                      >{`Retailers need data to win`}</p>
                    </div>

                    <div
                      className={styles.category}
                      onClick={() => setCategory("Philanthropic")}
                    >
                      <p
                        style={{ paddingLeft: "20px", color: "purple" }}
                      >{`Philanthropic`}</p>
                      <p
                        style={{ paddingLeft: "20px", color: "white" }}
                      >{`Do good together`}</p>
                    </div>
                  </div>
                </div>

                <div className={styles.createDataContainer}>
                  <h3 className={styles.createDataset}>Data Dao Details </h3>
                  <h5 style={{ color: "pink", paddingLeft: "20px" }}>
                    {category != null ? (
                      <> Category: {`${category}`}</>
                    ) : (
                      <>Category: Not selected</>
                    )}
                  </h5>
                  <MyDropzone />
                  <p
                    style={{ paddingLeft: "20px", color: "white" }}
                  >{`${fileDetails}`}</p>
                  <div style={{ margin: "20px" }}>
                    <div style={{ marginTop: "20px" }}>
                      <label style={{ color: "white" }}>Title</label>
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
                      <label style={{ color: "white" }}>Description</label>
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
                      <label style={{ color: "white" }}>Price (in TFIL)</label>
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

                    <button
                      type="button"
                      className={styles.viewAllDataDaoBtn}
                      onClick={() => Router.push("/viewDataSets")}
                    >
                      View all available Datasets
                    </button>
                  </div>
                </div>
              </div>
            </>
          }
        </div>
      </div>
    </>
  );
}
