// We trust all links we're sending to, so keep referrers for tracking
/* eslint-disable react/jsx-no-target-blank */

import axios from 'axios';
import {useRouter} from 'next/router';
import React, {useState, useEffect, useContext} from 'react';
import {useMfaEnrollment, usePrivy, useWallets, WalletWithMetadata} from '@privy-io/react-auth';
import Head from 'next/head';
import Loading from '../components/loading';
import AuthLinker from '../components/auth-linker';
import {clearDatadogUser} from '../lib/datadog';
import {DismissableInfo, DismissableError, DismissableSuccess} from '../components/toast';
import {formatWallet} from '../lib/utils';
import {Header} from '../components/header';
import CanvasContainer from '../components/canvas-container';
import CanvasSidebar from '../components/canvas-sidebar';
import CanvasCard from '../components/canvas-card';
import CanvasSidebarHeader from '../components/canvas-sidebar-header';
import {
  ArrowLeftOnRectangleIcon,
  ArrowUpOnSquareIcon,
  ArrowsUpDownIcon,
  CommandLineIcon,
  DevicePhoneMobileIcon,
  EnvelopeIcon,
  PencilIcon,
  PlusIcon,
  UserCircleIcon,
  WalletIcon,
  ShieldCheckIcon,
  LockClosedIcon,
} from '@heroicons/react/24/outline';
import Canvas from '../components/canvas';
import CanvasRow from '../components/canvas-row';
import CanvasCardHeader from '../components/canvas-card-header';
import PrivyConfigContext, {
  defaultDashboardConfig,
  defaultIndexConfig,
  PRIVY_STORAGE_KEY,
} from '../lib/hooks/usePrivyConfig';
import Image from 'next/image';
import PrivyBlobIcon from '../components/icons/outline/privy-blob';
import GitHubIcon from '../components/icons/social/github';
import AppleIcon from '../components/icons/social/apple';
import PhaverIcon from '../components/icons/social/phaver';
import TikTokIcon from '../components/icons/social/tiktok';
import TwitterXIcon from '../components/icons/social/twitter-x';
import FramesCard from '../components/frames-card';
import FarcasterIcon from '../components/icons/social/farcaster';
import {isMobile} from 'react-device-detect';

export default function DashboardPage() {
  const router = useRouter();
  const [signLoading, setSignLoading] = useState(false);
  const [signSuccess, setSignSuccess] = useState(false);
  const [signError, setSignError] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeWallet, setActiveWallet] = useState<WalletWithMetadata | null>(null);

  const {setConfig} = useContext(PrivyConfigContext);
  const {showMfaEnrollmentModal} = useMfaEnrollment();

  // set initial config, first checking for stored config, then falling back to default
  useEffect(() => {
    const storedConfigRaw = window.localStorage.getItem(PRIVY_STORAGE_KEY);
    const storedConfig = storedConfigRaw ? JSON.parse(storedConfigRaw) : null;
    setConfig?.({
      ...defaultDashboardConfig,
      appearance: storedConfig?.appearance
        ? storedConfig.appearance
        : defaultIndexConfig.appearance,
      embeddedWallets: {
        ...defaultIndexConfig.embeddedWallets,
        requireUserPasswordOnCreate:
          storedConfig?.embeddedWallets?.requireUserPasswordOnCreate ??
          defaultIndexConfig.embeddedWallets!.requireUserPasswordOnCreate,
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const {
    ready,
    authenticated,
    user,
    logout,
    linkEmail,
    linkWallet,
    unlinkEmail,
    linkPhone,
    unlinkPhone,
    linkGoogle,
    unlinkGoogle,
    linkTwitter,
    unlinkTwitter,
    linkDiscord,
    unlinkDiscord,
    linkGithub,
    unlinkGithub,
    linkApple,
    unlinkApple,
    linkPhaver,
    unlinkPhaver,
    linkLinkedIn,
    unlinkLinkedIn,
    linkTiktok,
    unlinkTiktok,
    linkFarcaster,
    unlinkFarcaster,
    getAccessToken,
    createWallet,
    exportWallet,
    unlinkWallet,
    setWalletPassword,
    setActiveWallet: sdkSetActiveWallet,
  } = usePrivy();

  const {wallets: connectedWallets} = useWallets();
  const mfaEnabled = user?.mfaMethods.length ?? 0 > 0;

  useEffect(() => {
    if (ready && !authenticated) {
      clearDatadogUser();
      router.push('/');
    }
  }, [ready, authenticated, router]);

  const linkedAccounts = user?.linkedAccounts || [];
  const wallets = linkedAccounts.filter((a) => a.type === 'wallet') as WalletWithMetadata[];
  const hasSetPassword = wallets.some(
    (w) => w.walletClientType === 'privy' && w.recoveryMethod === 'user-passcode',
  );

  const linkedAndConnectedWallets = wallets
    .filter((w) => connectedWallets.some((cw) => cw.address === w.address))
    .sort((a, b) => b.verifiedAt.toLocaleString().localeCompare(a.verifiedAt.toLocaleString()));

  useEffect(() => {
    // if no active wallet is set, set it to the first one if available
    if (!activeWallet && linkedAndConnectedWallets.length > 0) {
      setActiveWallet(linkedAndConnectedWallets[0]!);
    }
    // if an active wallet was removed from wallets, clear it out
    if (!linkedAndConnectedWallets.some((w) => w.address === activeWallet?.address)) {
      setActiveWallet(linkedAndConnectedWallets.length > 0 ? linkedAndConnectedWallets[0]! : null);
    }
  }, [activeWallet, linkedAndConnectedWallets]);

  const embeddedWallet = wallets.filter((wallet) => wallet.walletClient === 'privy')?.[0];

  const numAccounts = linkedAccounts.length || 0;
  const canRemoveAccount = numAccounts > 1;

  const emailAddress = user?.email?.address;
  const phoneNumber = user?.phone?.number;

  const googleSubject = user?.google?.subject;
  const googleName = user?.google?.name;

  const twitterSubject = user?.twitter?.subject;
  const twitterUsername = user?.twitter?.username;

  const discordSubject = user?.discord?.subject;
  const discordUsername = user?.discord?.username;

  const githubSubject = user?.github?.subject;
  const githubUsername = user?.github?.username;

  const linkedinSubject = user?.linkedin?.subject;
  const linkedinName = user?.linkedin?.name;

  const appleSubject = user?.apple?.subject;
  const appleEmail = user?.apple?.email;

  const phaverSubject = user?.phaver?.subject;
  const phaverEmail = user?.phaver?.email;

  const tiktokSubject = user?.tiktok?.subject;
  const tiktokUsername = user?.tiktok?.username;

  const farcasterSubject = user?.farcaster?.fid;
  const farcasterName = user?.farcaster?.username;

  if (!ready || !authenticated || !user) {
    return <Loading />;
  }

  async function deleteUser() {
    const authToken = await getAccessToken();
    try {
      await axios.delete('/api/users/me', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
    } catch (error) {
      console.error(error);
    }
    logout();
  }

  // Remove unknown walletClients.
  // `user` has to be `any` type because by default walletClient is required.
  const removeUnknownWalletClients = (user: any) => {
    user.linkedAccounts.forEach(function (linkedAccount: any, index: number) {
      if (linkedAccount.type === 'wallet' && linkedAccount.walletClient === 'unknown') {
        delete user.linkedAccounts[index].walletClient;
      }
    });
    if (user.wallet?.walletClient === 'unknown') {
      delete user.wallet.walletClient;
    }
    return user;
  };

  return (
    <>
      <Head>
        <title>Proof of SheFi</title>
      </Head>

      <div className="flex h-full flex-col px-6 pb-6">
        <Header />
        <CanvasContainer className="flex-col-reverse justify-center items-center">
          <Canvas className="gap-x-8 justify-center items-center">
            <CanvasRow>
              {isMobile && <FramesCard />}
              <CanvasCard>
                <CanvasCardHeader>
                  <WalletIcon className="h-5 w-5" strokeWidth={2} />
                  Wallets
                </CanvasCardHeader>
                <div className="pb-1 text-sm text-privy-color-foreground-3">
                  Connect and link wallets to your account.
                </div>
                <div className="flex flex-col gap-2">
                  {wallets.map((wallet) => {
                    return (
                      <AuthLinker
                        isLinked
                        wallet={wallet}
                        isActive={wallet.address === activeWallet?.address}
                        setActiveWallet={setActiveWallet}
                        key={wallet.address}
                        label={formatWallet(wallet.address)}
                        canUnlink={canRemoveAccount}
                        unlinkAction={() => {
                          unlinkWallet(wallet.address);
                        }}
                        walletConnectorName={
                          connectedWallets.find((cw) => cw.address === wallet.address)
                            ?.walletClientType
                        }
                        linkAction={linkWallet}
                        isConnected={connectedWallets.some((cw) => cw.address === wallet.address)}
                        connectAction={sdkSetActiveWallet}
                      />
                    );
                  })}
                  <button className="button h-10 gap-x-1 px-4 text-sm" onClick={linkWallet}>
                    <PlusIcon className="h-4 w-4" strokeWidth={2} />
                    Link a Wallet
                  </button>
                </div>
              </CanvasCard>
              {embeddedWallet ? (
                <CanvasCard>
                  <CanvasCardHeader>
                    <PrivyBlobIcon className="h-5 w-5 shrink-0 grow-0" strokeWidth={2} />
                    <div className="w-full">Embedded Wallet</div>
                    <div className="flex shrink-0 grow-0 flex-row items-center justify-end gap-x-1 text-privy-color-foreground-3">
                      {formatWallet(embeddedWallet.address)}
                    </div>
                  </CanvasCardHeader>
                  <div className="text-sm text-privy-color-foreground-3">
                    A user&apos;s embedded wallet is theirs to keep, and even take with them.
                  </div>
                  <div className="flex flex-col gap-2 pt-4">
                    {!hasSetPassword && (
                      <button
                        className="button h-10 gap-x-1 px-4 text-sm"
                        disabled={!(ready && authenticated)}
                        onClick={setWalletPassword}
                      >
                        <ShieldCheckIcon className="h-4 w-4" strokeWidth={2} />
                        Set a recovery password
                      </button>
                    )}
                    <button
                      className="button h-10 gap-x-1 px-4 text-sm"
                      disabled={!(ready && authenticated)}
                      onClick={exportWallet}
                    >
                      <ArrowUpOnSquareIcon className="h-4 w-4" strokeWidth={2} />
                      Export Embedded wallet
                    </button>
                  </div>
                </CanvasCard>
              ) : (
                // If they don't have an Embedded Wallet
                <CanvasCard>
                  <CanvasCardHeader>
                    <PrivyBlobIcon className="h-5 w-5 shrink-0 grow-0" strokeWidth={2} />
                    Embedded Wallet
                  </CanvasCardHeader>
                  <div className="text-sm text-privy-color-foreground-3">
                    With Privy, even non web3 natives can enjoy the benefits of life on chain.
                  </div>
                  <div className="flex flex-col gap-2 pt-4">
                    <button
                      className="button h-10 gap-x-1 px-4 text-sm"
                      disabled={!(ready && authenticated)}
                      onClick={() => {
                        createWallet();
                      }}
                    >
                      <PlusIcon className="h-4 w-4" strokeWidth={2} />
                      Create an Embedded Wallet
                    </button>
                  </div>
                </CanvasCard>
              )}
            </CanvasRow>

            <CanvasRow>
              <CanvasCard>
                <CanvasCardHeader>
                  <UserCircleIcon className="h-5 w-5" strokeWidth={2} />
                  Linked Socials
                </CanvasCardHeader>
                <div className="flex flex-col gap-2">
                  <AuthLinker
                    socialIcon={
                      <EnvelopeIcon
                        className="h-[1.125rem] w-[1.125rem] shrink-0 grow-0"
                        strokeWidth={2}
                      />
                    }
                    label="Email"
                    linkedLabel={`${emailAddress}`}
                    canUnlink={canRemoveAccount}
                    isLinked={!!emailAddress}
                    unlinkAction={() => {
                      unlinkEmail(emailAddress as string);
                    }}
                    linkAction={linkEmail}
                  />

                  <AuthLinker
                    socialIcon={
                      <div className="h-[1.125rem] w-[1.125rem] shrink-0 grow-0">
                        <Image
                          src="/social-icons/color/google.svg"
                          height={20}
                          width={20}
                          alt="Google"
                        />
                      </div>
                    }
                    label="Google"
                    linkedLabel={`${googleName}`}
                    canUnlink={canRemoveAccount}
                    isLinked={!!googleSubject}
                    unlinkAction={() => {
                      unlinkGoogle(googleSubject as string);
                    }}
                    linkAction={linkGoogle}
                  />

                  <AuthLinker
                    className="hidden md:flex"
                    socialIcon={
                      <div className="h-[1.125rem] w-[1.125rem] shrink-0 grow-0">
                        <TwitterXIcon height={18} width={18} />
                      </div>
                    }
                    label="Twitter"
                    linkedLabel={`${twitterUsername}`}
                    canUnlink={canRemoveAccount}
                    isLinked={!!twitterSubject}
                    unlinkAction={() => {
                      unlinkTwitter(twitterSubject as string);
                    }}
                    linkAction={linkTwitter}
                  />

                  <AuthLinker
                    socialIcon={
                      <div className="h-[1.125rem] w-[1.125rem] shrink-0 grow-0 text-privy-color-foreground">
                        <AppleIcon height={18} width={18} />
                      </div>
                    }
                    label="Apple"
                    linkedLabel={`${appleEmail}`}
                    canUnlink={canRemoveAccount}
                    isLinked={!!appleSubject}
                    unlinkAction={() => {
                      unlinkApple(appleSubject as string);
                    }}
                    linkAction={linkApple}
                  />

<AuthLinker
                    socialIcon={
                      <div className="h-[1.125rem] w-[1.125rem] shrink-0 grow-0 text-privy-color-foreground">
                        <PhaverIcon height={18} width={18} />
                      </div>
                    }
                    label="Phaver"
                    linkedLabel={`${phaverEmail}`}
                    canUnlink={canRemoveAccount}
                    isLinked={!!phaverSubject}
                    unlinkAction={() => {
                      unlinkPhaver(phaverSubject as string);
                    }}
                    linkAction={linkPhaver}
                  />

                  <AuthLinker
                    socialIcon={
                      <div className="h-[1.125rem] w-[1.125rem] shrink-0 grow-0">
                        <Image
                          src="/social-icons/color/linkedin.svg"
                          height={20}
                          width={20}
                          alt="LinkedIn"
                        />
                      </div>
                    }
                    label="LinkedIn"
                    linkedLabel={`${linkedinName}`}
                    canUnlink={canRemoveAccount}
                    isLinked={!!linkedinSubject}
                    unlinkAction={() => {
                      unlinkLinkedIn(linkedinSubject as string);
                    }}
                    linkAction={linkLinkedIn}
                  />
                  <AuthLinker
                    socialIcon={
                      <div className="h-[1.125rem] w-[1.125rem] shrink-0 grow-0 text-privy-color-foreground">
                        <FarcasterIcon height={18} width={18} />
                      </div>
                    }
                    label="Farcaster"
                    linkedLabel={`${farcasterName}`}
                    canUnlink={canRemoveAccount}
                    isLinked={!!farcasterSubject}
                    unlinkAction={() => {
                      unlinkFarcaster(farcasterSubject as number);
                    }}
                    linkAction={linkFarcaster}
                  />
                </div>
              </CanvasCard>
            </CanvasRow>
            {!isMobile && (
              <CanvasRow>
                <FramesCard />
              </CanvasRow>
            )}
          </Canvas>
        </CanvasContainer>
      </div>
    </>
  );
}
