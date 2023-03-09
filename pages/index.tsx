import Head from "next/head";
import styles from "@/styles/Home.module.css";
import Modal from "react-modal";
import { ethers } from "ethers";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

//ABIs
import dataDaoABI from "../utils/dataDaoABI.json";
//progress bar
import ProgressBar from "./progressbar";

type Proposal = {
  description: string;
  title: string;
  status: string;
  contractAddress: string;
};

type ProposalDetails = {
  proposalInfo: Proposal;
  proposedBy: string;
  noOfYes: string;
  noOfNo: string;
  thresHold: string;
  cid: string;
  hasCurrentUserVoted: boolean;
  hasDatasetbeenListed: boolean;
};

export type SubSection = "Proposals" | "New Proposal";
type verificationStatus = "Verifying Datset....." | "Verification Success!";
export default function Home() {
  //variables
  const [dataDaoContractAddress, setSmartContractAddress] =
    useState<string>("");

  const [isLoading, setIsLoading] = useState(false);
  const [loadedData, setLoadedData] = useState("Loading...");

  const [currentWalletAddress, setCurrentWalletAddress] = useState<string>("");

  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");

  const [section, setSection] = useState<SubSection>("Proposals");
  const [hasJoinedDao, setHasJoinedDao] = useState<Boolean>(false);

  const [allProposals, setAllProposals] = useState<Proposal[]>([]);
  const [activeProposalDetails, setProposalDetails] =
    useState<ProposalDetails | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [isVotingModalOpen, setVotingModalOpen] = useState(false);
  const [DAOListedModalOpen, setDAOListedModalOpen] = useState(false);
  const [datasetVerificationStatus, setDatasetVerificaionStatus] =
    useState<verificationStatus>("Verifying Datset.....");
  function onChangeSectionClick(section: SubSection) {
    setProposalDetails(null);
    setSection(section);
  }

  function openModal() {
    setIsLoading(true);
  }

  function closeModal() {
    setIsLoading(false);
  }

  async function checkIfUserJoinedDao(smartContractAddress: string) {
    const { ethereum } = window;

    // Check if MetaMask is installed
    if (!ethereum) {
      return "Make sure you have MetaMask Connected!";
    }

    if (ethereum) {
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();

      //create DataDao contract instance
      const dataDAOContractInstance = new ethers.Contract(
        smartContractAddress,
        dataDaoABI,
        signer
      );

      //check if current wallet address has joined the datadao
      const isMember = await dataDAOContractInstance.checkIfMember();
      setHasJoinedDao(isMember);
    }
  }

  async function getAllProposalDetails(smartContractAddress: string) {
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

    //set loading modal to open and loading modal text
    setLoadedData("loading...Please wait");
    openModal();

    //call smart contract

    if (ethereum) {
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();

      //(1) create DataDao contract instance

      //(2) call getTradingProposalList function

      //(3) set proposal data into variable

      //check if user has joined DAO
      await checkIfUserJoinedDao(smartContractAddress);
    }

    //close modal
    closeModal();
  }

  async function joinDataDAO() {
    try {
      //set loading modal to open and loading modal text
      setLoadedData("Joining DAO...Please wait");
      openModal();

      //call smart contract
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();

        //create DataDao contract instance
        const dataDAOContractInstance = new ethers.Contract(
          dataDaoContractAddress,
          dataDaoABI,
          signer
        );

        //(4) call joinDataDao function from the datadao contract

        //(5) wait for transaction to be mined

        //(6) display alert message

        //update that user has joined the dao
        await checkIfUserJoinedDao(dataDaoContractAddress);

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

  async function createProposal() {
    try {
      //check if current wallet address of user has joined the DAO
      if (hasJoinedDao === false) {
        return alert("Please join the DAO before creating the proposal.");
      }

      //check fields of proposal
      if (!description || !title) {
        return alert("Fill in all the fields needed!");
      }

      //set loading modal to open and loading modal text
      setLoadedData("Creating Proposal...Please wait");
      openModal();
      //call smart contract
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();

        //create DataDao contract instance
        const dataDAOContractInstance = new ethers.Contract(
          dataDaoContractAddress,
          dataDaoABI,
          signer
        );

        //(7) call joinDataDao function from the datadao contract

        //(8) wait for transaction to be mined

        //(9) display alert message

        //get updated proposals
        await getAllProposalDetails(dataDaoContractAddress);

        //reset fields back to default values
        setTitle("");
        setDescription("");

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

  async function getActiveProposalDetails(proposal: Proposal) {
    if (hasJoinedDao === false) {
      return alert("Please join the DAO before viewing the proposal.");
    }

    const { ethereum } = window;

    if (ethereum) {
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();

      //create DataDao contract instance
      const dataDAOContractInstance = new ethers.Contract(
        dataDaoContractAddress,
        dataDaoABI,
        signer
      );

      const info = await dataDAOContractInstance.getDetailedTradingProposalInfo(
        proposal.contractAddress
      );

      //check if user voted before
      const hasVoted = await dataDAOContractInstance.hasVoted(
        proposal.contractAddress
      );

      //check if data dao has been listed
      const hasDataBeenListed =
        await dataDAOContractInstance.checkIfDatasetIsListed(
          proposal.contractAddress
        );

      setProposalDetails({
        proposalInfo: proposal,
        proposedBy: info._proposer,
        noOfYes: info._numberOfYesVotes.toString(),
        noOfNo: info._numberOfNoVotes.toString(),
        thresHold: info._voteThreshold.toString(),
        cid: info._cid,
        hasCurrentUserVoted: hasVoted,
        hasDatasetbeenListed: hasDataBeenListed,
      });
    }
  }

  async function voteForProposal(proposal: ProposalDetails, yesOrNo: boolean) {
    try {
      //check if current wallet address of user has joined the DAO
      if (hasJoinedDao === false) {
        return alert("Please join the DAO before creating the proposal.");
      }
      setVotingModalOpen(false);
      await loadingModal();
      setTimeout(async () => {
        //call smart contract
        const { ethereum } = window;
        if (ethereum) {
          //set loading modal to open and loading modal text
          setLoadedData("Voting...Please wait");
          openModal();

          const provider = new ethers.providers.Web3Provider(ethereum);
          const signer = provider.getSigner();

          //create DataDao contract instance
          const dataDAOContractInstance = new ethers.Contract(
            dataDaoContractAddress,
            dataDaoABI,
            signer
          );

          //(10) call joinDataDao function from the datadao contract

          //(11) wait for transaction to be mined

          //(12) display alert message

          // get updated proposal details
          await getActiveProposalDetails(proposal.proposalInfo);

          //close modal
          closeModal();
        }
      }, 3100);
    } catch (error) {
      console.log(error);
      closeModal();
      alert(`Error: ${error}`);
      return `${error}`;
    }
  }

  async function listDataDao(proposal: ProposalDetails) {
    if (parseInt(proposal.noOfYes) !== 2) {
      return alert("Proposal has not passed.");
    }

    try {
      //call smart contract
      const { ethereum } = window;
      if (ethereum) {
        //set loading modal to open and loading modal text
        setLoadedData("listing...Please wait");
        openModal();

        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();

        //create DataDao contract instance
        const dataDAOContractInstance = new ethers.Contract(
          dataDaoContractAddress,
          dataDaoABI,
          signer
        );

        // call listDataset function from the datadao contract
        let { hash } = await dataDAOContractInstance.listDataset(
          proposal.proposalInfo.contractAddress
        );

        // wait for transaction to be mined
        await provider.waitForTransaction(hash);
        // display alert message
        alert(`Transaction sent! Hash: ${hash}`);

        // get updated proposal details
        await getActiveProposalDetails(proposal.proposalInfo);

        //close modal
        closeModal();
      }

      //upate list status to Listed
      setDAOListedModalOpen(true);
    } catch (error) {
      console.log(error);
      closeModal();
      alert(`Error: ${error}`);
      return `${error}`;
    }
  }

  async function getSmartContractAddress() {
    const addr = process.env.NEXT_PUBLIC_SMART_CONTRACT_ADDRESS;

    if (addr != undefined) {
      setSmartContractAddress(addr);
      getAllProposalDetails(addr);
    }
  }
  async function loadingModal() {
    setIsVerifying(true);

    setTimeout(async () => {
      setDatasetVerificaionStatus("Verification Success!");
    }, 2000);

    setTimeout(async () => {
      setIsVerifying(false);
    }, 3000);
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

  function getStyle(currentSection: SubSection) {
    let myStyle = {};

    if (section === currentSection) {
      myStyle = {
        color: "white",
        paddingLeft: "10px",
        paddingTop: "10px",
        paddingBottom: "10px",
        borderLeftWidth: "3px",
        borderTopWidth: "0px",
        borderRightWidth: "0px",
        borderBottomWidth: "0px",
        borderColor: "white",
        borderStyle: "ridge",
      };
    } else {
      myStyle = {
        color: "white",
        paddingLeft: "10px",
        paddingTop: "10px",
        paddingBottom: "10px",
        borderStyle: "none",
      };
    }

    return myStyle;
  }

  function renderModalForVoting(proposal: ProposalDetails) {
    return (
      <>
        <div>Please vote for the proposal</div>
        <div style={{ display: "flex" }}>
          <div>
            {proposal.proposedBy.toLowerCase() !== currentWalletAddress ? (
              <button
                className={styles.yesBtn}
                onClick={() => voteForProposal(proposal, true)}
              >
                Yes
              </button>
            ) : null}
          </div>

          <div>
            {proposal.proposedBy.toLowerCase() !== currentWalletAddress ? (
              <button
                className={styles.noBtn}
                onClick={() => voteForProposal(proposal, false)}
              >
                No
              </button>
            ) : null}
          </div>
        </div>
        <div>
          <button
            className={styles.closeModalBtn}
            onClick={() => setVotingModalOpen(false)}
          >
            Close
          </button>
        </div>
      </>
    );
  }

  function renderAllProposals(proposal: Proposal) {
    return (
      <div className={styles.allProposalContainer}>
        <h4 className={styles.paragraphText}>Title: {proposal.title}</h4>
        <p className={styles.paragraphText}>
          Description: {proposal.description}
        </p>
        <p className={styles.paragraphText}>Status: {proposal.status}</p>
        <p className={styles.paragraphText}>
          Address: {proposal.contractAddress}
        </p>

        <button
          className={styles.viewDetailsBtn}
          onClick={() => {
            getActiveProposalDetails(proposal);
          }}
        >
          View Details
        </button>
      </div>
    );
  }

  function renderActiveProposal(proposal: ProposalDetails) {
    let votingProposalStatus = proposal.cid;
    if (parseFloat(proposal.noOfYes) === 2) {
      votingProposalStatus = "Success";
    }

    let colour = "purple";
    if (votingProposalStatus === "Success") {
      colour = "green";
    } else if (votingProposalStatus === "Trading Proposal Failed") {
      colour = "red";
    } else {
      colour = "purple";
    }

    return (
      <>
        <div style={{ display: "flex" }}>
          <div className={styles.activeDataDaoContainer}>
            <h2 className={styles.paragraphText}>
              {proposal.proposalInfo.title}
            </h2>

            <div style={{ justifyContent: "space-between", display: "flex" }}>
              <div className={styles.ProposerText}>
                Proposed by: {proposal.proposedBy}
              </div>

              <div
                className={styles.votingStatus}
                style={{ backgroundColor: colour }}
              >
                {votingProposalStatus}
              </div>
            </div>

            <h4 className={styles.paragraphText}>Proposal Description</h4>

            <div style={{ color: "white", margin: "10px" }}>
              {proposal.proposalInfo.description}
            </div>

            <div>
              <div
                className={styles.voteResultsContainer}
                style={{ marginTop: "50px" }}
              >
                <h4 style={{ color: "white", padding: "10px" }}>Results</h4>
              </div>

              <div className={styles.voteResultsContainer}>
                <p className={styles.paragraphText}>
                  Number of yes: {proposal.noOfYes}
                </p>
                <ProgressBar
                  bgcolor={"#ef6c00"}
                  completed={(parseFloat(proposal.noOfYes) / 2) * 100}
                />
                <p className={styles.paragraphText}>
                  Number of No: {proposal.noOfNo}
                </p>
                <ProgressBar
                  bgcolor={"#ef6c00"}
                  completed={(parseFloat(proposal.noOfNo) / 2) * 100}
                />
              </div>
            </div>

            <div style={{ display: "flex" }}>
              {proposal.proposedBy.toLowerCase() !== currentWalletAddress &&
              proposal.hasCurrentUserVoted === false &&
              parseInt(proposal.noOfNo) + parseInt(proposal.noOfYes) !== 2 ? (
                <button
                  className={styles.yesBtn}
                  onClick={() => setVotingModalOpen(true)}
                >
                  Proceed to Vote
                </button>
              ) : null}

              <button
                className={styles.backBtn}
                onClick={() => setProposalDetails(null)}
              >
                Back to all Proposals
              </button>

              {parseFloat(proposal.noOfYes) === 2 &&
              proposal.proposedBy.toLowerCase() === currentWalletAddress &&
              proposal.hasDatasetbeenListed === false ? (
                <button
                  className={styles.listDAOBtn}
                  onClick={() => listDataDao(proposal)}
                >
                  List your Dataset
                </button>
              ) : null}
            </div>
          </div>

          <div>
            <div
              className={styles.voteResultsContainer}
              style={{ marginTop: "50px" }}
            >
              <h4 style={{ color: "white", padding: "10px" }}>Information</h4>
            </div>

            <div className={styles.voteResultsContainer}>
              <p className={styles.paragraphText}>Dataset: Research.json</p>
              <p className={styles.paragraphText}>
                Status :{" "}
                {proposal.hasDatasetbeenListed === true
                  ? "Listed"
                  : "Not Listed"}
              </p>
              {proposal.hasDatasetbeenListed === true ? (
                <>
                  <div style={{ display: "flex" }}>
                    <p className={styles.paragraphText}>Dataset Deal Id: </p>
                    <p className={styles.hyperlinkText}>
                      <Link
                        href={`https://hyperspace.filfox.info/en/deal/967`}
                        target="_blank"
                      >
                        {967}
                      </Link>
                    </p>
                  </div>

                  <p className={styles.paragraphText}>Data Cid:</p>
                  <p className={styles.shortenParagraphText}>{proposal.cid}</p>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </>
    );
  }

  useEffect(() => {
    getSmartContractAddress();
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

        <Modal
          isOpen={isVerifying}
          //onRequestClose={closeModal}
          style={customStyles}
          contentLabel="Example Modal"
        >
          {datasetVerificationStatus}
        </Modal>

        <Modal
          isOpen={DAOListedModalOpen}
          //onRequestClose={closeModal}
          style={customStyles}
          contentLabel="Example Modal"
        >
          Your Dataset has been listed.
          <div style={{ margin: "20px" }}>
            <button
              className={styles.closeModalBtn}
              onClick={() => setDAOListedModalOpen(false)}
            >
              Close
            </button>
          </div>
        </Modal>

        <Modal
          isOpen={isVotingModalOpen} //change variable
          style={customStyles}
          contentLabel="Example Modal"
        >
          <div>
            {activeProposalDetails != null
              ? renderModalForVoting(activeProposalDetails as ProposalDetails)
              : null}
          </div>
        </Modal>

        <div>
          <>
            <div style={{ display: "flex" }}>
              <div style={{ marginLeft: "100px" }}>
                <div className={styles.createDataContainer}>
                  <Image
                    src="/research.jpg"
                    alt="image dao"
                    width={70}
                    height={70}
                    style={{
                      alignItems: "center",
                      display: "block",
                      margin: "auto",
                      marginTop: "10px",
                      borderRadius: "50px",
                    }}
                  />

                  <h3 className={styles.createDataset}>Research DAO</h3>
                  <div>
                    {hasJoinedDao == false ? (
                      <button
                        type="button"
                        className={styles.joinDataDaoBtn}
                        style={{
                          alignItems: "center",
                          display: "block",
                          margin: "auto",
                          marginBottom: "20px",
                        }}
                        onClick={() => joinDataDAO()}
                      >
                        Join
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          className={styles.joinDataDaoDisabledBtn}
                          style={{
                            alignItems: "center",
                            display: "block",
                            margin: "auto",
                            marginBottom: "20px",
                          }}
                          disabled={true}
                        >
                          Joined
                        </button>
                      </>
                    )}
                  </div>

                  <div
                    style={getStyle("Proposals")}
                    className={styles.subSection}
                    onClick={() => onChangeSectionClick("Proposals")}
                  >
                    Proposals
                  </div>

                  <div
                    style={getStyle("New Proposal")}
                    className={styles.subSection}
                    onClick={() => onChangeSectionClick("New Proposal")}
                  >
                    New Proposal
                  </div>
                </div>
              </div>

              <div>
                {section === "Proposals" ? (
                  <>
                    {activeProposalDetails !== null ? null : (
                      <h2 className={styles.sectionHeader}>Proposals</h2>
                    )}

                    <div>
                      {activeProposalDetails != null ? (
                        renderActiveProposal(activeProposalDetails)
                      ) : (
                        <>
                          <div>
                            {allProposals.map((proposal) =>
                              renderAllProposals(proposal)
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <h2 className={styles.sectionHeader}>Create a Proposal</h2>
                    <div style={{ margin: "20px" }}>
                      <label className={styles.normalHeader}>Title</label>
                      <input
                        type="search"
                        placeholder="Add a Title here"
                        onChange={(e) => setTitle(e.target.value)}
                        value={title}
                        style={{
                          padding: "15px",
                          textAlign: "center",
                          display: "block",
                          backgroundColor: "black",
                          color: "white",
                          width: "700px",
                          marginBottom: "10px",
                          marginTop: "10px",
                          textAlignLast: "left",
                        }}
                      />
                    </div>

                    <div style={{ margin: "20px" }}>
                      <label className={styles.normalHeader}>Description</label>
                      <input
                        type="text"
                        placeholder="Add a short description here."
                        onChange={(e) => setDescription(e.target.value)}
                        value={description}
                        style={{
                          padding: "15px",
                          textAlign: "center",
                          display: "block",
                          backgroundColor: "black",
                          color: "white",
                          width: "700px",
                          marginBottom: "10px",
                          marginTop: "10px",
                          textAlignLast: "left",
                        }}
                      />
                    </div>

                    <button
                      type="button"
                      className={styles.createProposalBtn}
                      style={{ margin: "20px" }}
                      onClick={() => createProposal()}
                    >
                      Create a Proposal
                    </button>
                  </>
                )}
              </div>
            </div>
          </>
        </div>
      </div>
    </>
  );
}
