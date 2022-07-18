import { ClipboardCheckIcon, ClipboardCopyIcon, ExternalLinkIcon, KeyIcon, LockClosedIcon, WifiIcon } from '@heroicons/react/solid';
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { LoadingButton } from 'renderer/components/content/shared/animations';
import combineInventory, {
  classNames, sortDataFunction,
} from 'renderer/components/content/shared/filters/inventoryFunctions';
import NotificationElement from 'renderer/components/content/shared/modals & notifcations/notification';
import SteamLogo from 'renderer/components/content/shared/steamLogo';
import { filterItemRows } from 'renderer/functionsClasses/filters/custom';
import { ReducerManager } from 'renderer/functionsClasses/reducerManager';
import { State } from 'renderer/interfaces/states';
import { inventory_setFiltered } from 'renderer/store/actions/filtersInventoryActions';
import { setInventoryAction } from 'renderer/store/actions/inventoryActions';
import {
  setCurrencyRate,
  setLocale,
  setSourceValue,
} from 'renderer/store/actions/settings';
import { signIn } from 'renderer/store/actions/userStatsActions';
import { getURL } from 'renderer/store/helpers/userStatusHelper';

export default function LoginForm({ isLock, replaceLock, runDeleteUser }) {
  // Usestate
  const settingsData = useSelector((state: any) => state.settingsReducer);
  isLock;
  replaceLock;
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [authCode, setAuthCode] = useState('');
  const [sharedSecret, setSharedSecret] = useState('');
  const [clientjstoken, setClientjstoken] = useState('');
  const [doShow, setDoShow] = useState(false);
  const [wasSuccess, setWasSuccess] = useState(false);
  const [titleToDisplay, setTitleToDisplay] = useState('test');
  const [textToDisplay, setTextToDisplay] = useState('test');
  const [storePassword, setStorePassword] = useState(false);
  const [getLoadingButton, setLoadingButton] = useState(false);
  const [secretEnabled, setSecretEnabled] = useState(false);
  
  const ReducerClass = new ReducerManager(useSelector)
  const currentState: State = ReducerClass.getStorage()
  // Handle login
  const dispatch = useDispatch();
  // Return 1 = Success
  // Return 2 = Steam Guard
  // Return 3 = Steam Guard wrong
  // Return 4 = Wrong password
  // Return 5 = Playing elsewhere

  async function openNotification(success, title, text) {
    setWasSuccess(success);
    setTitleToDisplay(title);
    setTextToDisplay(text);
    setDoShow(true);
  }

  let hasChosenAccountLoginKey = false;
  if (isLock.length == 2 && isLock[1] != undefined) {
    hasChosenAccountLoginKey = true;
  }
  hasChosenAccountLoginKey;
  isLock = isLock[0];
  async function onSubmit() {
    setLoadingButton(true);

    let clientjstokenToSend = clientjstoken as any;
    // Validate web token
    if (webToken) {
      // Is json string?
      try {
        clientjstokenToSend = JSON.parse(clientjstoken)
      }
      catch {
        openNotification(
          false,
          'Not a JSON string',
          'Did you copy the entire string? Try again.'
        );
        setLoadingButton(false)
        setClientjstoken('')
        return
      }

      // Is logged in?
      if (!clientjstokenToSend.logged_in) {
        openNotification(
          false,
          'Not logged in',
          'Please log in to the browser and try again.'
        );
        setLoadingButton(false)
        setClientjstoken('')
        return
      }
    } else {
      clientjstokenToSend = ''
    }


    let responseCode = 1;
    responseCode = 1;
    let usernameToSend = username as any;
    let passwordToSend = password as any;
    let storePasswordToSend = storePassword as any;
    if (isLock != '') {
      usernameToSend = isLock;
      passwordToSend = null;
      storePasswordToSend = true;
    }
    console.log(clientjstokenToSend)
    const responseStatus = await window.electron.ipcRenderer.loginUser(
      usernameToSend,
      passwordToSend,
      clientjstokenToSend != '' ? false : storePasswordToSend,
      authCode,
      sharedSecret,
      clientjstokenToSend
    );
    responseCode = responseStatus[0];

    // Notification
    switch (responseCode) {
      case 1:
        openNotification(
          true,
          'Logged in successfully!',
          'The app has successfully logged you in. Happy storaging.'
        );
        break;
      case 2:
        openNotification(
          false,
          'Steam Guard error!',
          'Steam Guard might be required. Try again.'
        );
        break;
      case 3:
        openNotification(
          false,
          'Wrong Steam Guard code',
          'Got the wrong Steam Guard code. Try again.'
        );
        break;

      case 4:
        openNotification(
          false,
          'Unknown error',
          'Could be wrong credentials, a network error, the account playing another game or something else. ' +
            responseStatus[1]
        );
        setUsername('');
        setPassword('');
        break;

      case 5:
        openNotification(
          false,
          'Playing elsewhere',
          'You were logged in but the account is currently playing elsewhere. Close the session and try again.'
        );
        break;
      case 6:
        openNotification(
          false,
          'Wrong login token',
          'Got the wrong login token.'
        );
        replaceLock()
        runDeleteUser(usernameToSend)

        break;
    }
    // If success login

    if (responseCode == 1) {
      // Currency rate
      await window.electron.ipcRenderer
        .getCurrencyRate()
        .then((returnValue) => {
          console.log('currencyrate', returnValue);
          dispatch(setCurrencyRate(returnValue[0], returnValue[1]));
        });
      // Source
      await window.electron.store.get('pricing.source').then((returnValue) => {
        let valueToWrite = returnValue;
        if (returnValue == undefined) {
          valueToWrite = {
            id: 1,
            name: 'Steam Community Market',
            title: 'steam_listing',
            avatar: 'https://steamcommunity.com/favicon.ico',
          };
        }
        dispatch(setSourceValue(valueToWrite));
      });
      await window.electron.store.get('locale').then((returnValue) => {
        dispatch(setLocale(returnValue));
      });
      let returnPackage = {
        steamID: responseStatus[1][0],
        displayName: responseStatus[1][1],
        CSGOConnection: responseStatus[1][2],
        wallet: responseStatus[1][4],
      };
      await new Promise((r) => setTimeout(r, 2500));
      try {
        const profilePicture = await getURL(returnPackage.steamID);
        returnPackage['userProfilePicture'] = profilePicture;
      } catch (error) {
        returnPackage['userProfilePicture'] =
          'https://raw.githubusercontent.com/SteamDatabase/GameTracking-CSGO/master/csgo/pak01_dir/resource/flash/econ/characters/customplayer_tm_separatist.png';
      }

      dispatch(signIn(returnPackage));
      const combined = await combineInventory(
        responseStatus[1][3],
        settingsData
      );
      dispatch(
        setInventoryAction({
          inventory: responseStatus[1][3],
          combinedInventory: combined,
        })
      );
      let filteredInv = await filterItemRows(combined, currentState.inventoryFiltersReducer.inventoryFilter)
      filteredInv = await sortDataFunction(currentState.inventoryFiltersReducer.sortValue, filteredInv, currentState.pricingReducer.prices, currentState.settingsReducer?.source?.title)
      console.log(filteredInv)
      dispatch(
        inventory_setFiltered(currentState.inventoryFiltersReducer.inventoryFilter, currentState.inventoryFiltersReducer.sortValue, filteredInv)
      );
    } else {
      setAuthCode('');
    }
    setLoadingButton(false);
  }
  async function updateUsername(value) {
    setUsername(value);
    if (isLock != '') {
      replaceLock();
    }
  }
  async function updatePassword(value) {
    setPassword(value);
    if (isLock != '') {
      replaceLock();
    }
  }

  const [seenOnce, setOnce] = useState(false);
  const [webToken, setWebToken] = useState(false);
  const [sendSubmit, shouldSubmit] = useState(false);
  if (seenOnce == false) {
    document.addEventListener('keyup', ({ key }) => {
      if (key == 'Enter') {
        shouldSubmit(true);
      }
    });
    setOnce(true);
  }

  if (sendSubmit) {
    onSubmit();
    shouldSubmit(false);
  }
  console.log(sendSubmit)

  async function handleSubmit(e) {
    e.preventDefault()
  }

  return (
    <>
      <div className="min-h-full flex items-center  pt-32 justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div>
            <SteamLogo />
            <h2 className="mt-6 text-center dark:text-dark-white text-3xl font-extrabold text-gray-900">
              {
                !webToken ? 'Connect to Steam' : 'Connect from browser'
              }
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              {
                !webToken ? 'The application needs to have an active Steam connection to manage your CSGO items. You should not have any games open on the Steam account.'
                : 'Open the URL by clicking on the button, or by copying it to the clipboard. You should be logged into the account you wish to connect Casemove with. Paste the entire string below.'
              }

            </p>
          </div>

          <form className="mt-8 mb-6" onSubmit={(e) => handleSubmit(e)}>
            <input type="hidden" name="remember" defaultValue="true" />
            {
              !webToken ?
            <div className="rounded-md mb-6">
              <div>
                <label htmlFor="email-address" className="sr-only">
                  Username
                </label>
                <input
                  id="username"
                  name="username"
                  onChange={(e) => updateUsername(e.target.value)}
                  spellCheck={false}
                  required
                  value={isLock == '' ? username : isLock}
                  className="appearance-none dark:bg-dark-level-one dark:text-dark-white dark:bg-dark-level-one  dark:border-opacity-50 rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Username"
                />
              </div>
              {!hasChosenAccountLoginKey ? (
                <div>
                  <label htmlFor="password" className="sr-only">
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    onChange={(e) => updatePassword(e.target.value)}
                    autoComplete="current-password"
                    required
                    value={isLock == '' ? password : '~{nA?HJjb]7hB7-'}
                    className="appearance-none dark:text-dark-white rounded-none dark:bg-dark-level-one  dark:border-opacity-50 relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900  focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                    placeholder="Password"
                  />
                </div>
              ) : (
                ''
              )}
              {!hasChosenAccountLoginKey ? (
                <div>
                  <label htmlFor="authcode" className="sr-only">
                    Steam Guard
                  </label>
                  <input
                    id="authcode"
                    name="authcode"
                    value={authCode}
                    onChange={(e) => setAuthCode(e.target.value)}
                    spellCheck={false}
                    required
                    className="appearance-none rounded-none dark:bg-dark-level-one dark:text-dark-white dark:border-opacity-50 relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                    placeholder="Authcode (optional)"
                  />
                </div>
              ) : (
                <div className="pt-1 flex items-center">
                  <LockClosedIcon className="h-4 mr-1 w-4 dark:text-gray-500" />
                  <span className="dark:text-gray-500 sm:text-sm mt-0.5 ">
                    Password and Steam Guard code not required
                  </span>
                </div>
              )}

              {!hasChosenAccountLoginKey ? (
                <div className={classNames(secretEnabled ? '' : 'hidden')}>
                  <label htmlFor="secret" className="sr-only">
                    SharedSecret
                  </label>
                  <input
                    id="secret"
                    name="secret"
                    value={sharedSecret}
                    onChange={(e) => setSharedSecret(e.target.value)}
                    spellCheck={false}
                    required
                    className="appearance-none rounded-none dark:bg-dark-level-one dark:text-dark-white dark:border-opacity-50 relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                    placeholder="Shared Secret (If you don't know what this is, leave it empty.)"
                  />
                </div>
              ) : (
                ''
              )}
            </div> : <div className="rounded-md mb-6">

      <div className="mt-1 flex rounded-md shadow-sm">
        <div className="relative flex items-stretch flex-grow focus-within:z-10">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <ClipboardCheckIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </div>
          <input
            type="text"
            name="clientjs"
            id="clientjs"
            value={clientjstoken}
            onChange={(e) => setClientjstoken(e.target.value)}
            className="bg-dark-level-one focus:border-green-500 block w-full rounded-none rounded-l-md pl-10 sm:text-sm border border-gray-300 border-opacity-50 focus:outline-none text-dark-white "
            placeholder="Paste data"
          />
        </div>
        <button
          onClick={() => navigator.clipboard.writeText(`https://steamcommunity.com/chat/clientjstoken`)}
          type="button"
          className="-ml-px relative inline-flex items-center space-x-2 px-4 py-2 border border-gray-300 border-opacity-50 text-sm font-medium text-gray-700 bg-dark-level-two hover:bg-dark-level-three focus:outline-none focus:border-green-500  "
        >
          <ClipboardCopyIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
        </button>
        <Link
         to={{
          pathname: `https://steamcommunity.com/chat/clientjstoken`,
        }}
        target="_blank"
          className="-ml-px relative inline-flex items-center space-x-2 px-4 py-2 border border-gray-300 border-opacity-50 text-sm font-medium rounded-r-md text-gray-700 bg-dark-level-two hover:bg-dark-level-three focus:outline-none focus:border-green-500  "
        >
          <ExternalLinkIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
        </Link>
    </div>

            </div> }
            {!hasChosenAccountLoginKey ?
            <div className={classNames(!webToken ? '' : 'hidden', "flex items-center justify-between")}>
              <div className="flex items-center">
                {isLock == '' ? (
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    defaultChecked={storePassword}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    onChange={() => setStorePassword(!storePassword)}
                  />
                ) : !hasChosenAccountLoginKey ? (
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    checked={true}
                    className=" pointer-events-none h-4 w-4 text-indigo-600 focus:ring-indigo-500 dark:text-opacity-50 border-gray-300 rounded"
                    onChange={() => setStorePassword(!storePassword)}
                  />
                ) : (
                  ''
                )}

                {isLock == '' ? (
                  <label
                    htmlFor="remember-me"
                    className="ml-2 block text-sm text-gray-900 dark:text-dark-white"
                  >
                    Remember for later
                  </label>
                ) : !hasChosenAccountLoginKey ? (
                  <label
                    htmlFor="remember-me"
                    className="ml-2 pointer-events-none block text-sm text-gray-900 dark:text-opacity-50 dark:text-dark-white"
                  >
                    Remember for later
                  </label>
                ) : (
                  ''
                )}
              </div>
              {!hasChosenAccountLoginKey ? (
                <div className="flex items-center">
                  <label
                    htmlFor="sharedSecret"
                    className="mr-2 block text-sm text-gray-900 dark:text-dark-white"
                  >
                    Show secret field
                  </label>
                  <input
                    id="sharedSecret"
                    name="sharedSecret"
                    type="checkbox"
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    onChange={() => setSecretEnabled(!secretEnabled)}
                  />
                </div>
              ) : (
                ''
              )}
            </div> : '' }

            <div className='flex justify-between mt-6'>
            <button
                className=" group text-dark-white relative w-1/2 flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-dark-level-two hover:bg-dark-level-three "
                onClick={() => setWebToken(!webToken)}
                type="button"
              >
                <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                  {webToken ? (
                    <KeyIcon
                    className="h-5 w-5 text-dark-white"
                    aria-hidden="true"
                  />
                  ) : (
                    <WifiIcon
                      className="h-5 w-5 text-dark-white"
                      aria-hidden="true"
                    />
                  )}
                </span>
                <span className='pl-3'>
                  {!webToken ? 'Browser' : 'Credentials'}
                </span>
              </button>

              <button
                className="focus:bg-indigo-700 group relative w-full flex justify-center py-2 px-4 ml-3 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 "
                onClick={() => onSubmit()}
                type="button"
              >
                <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                  {getLoadingButton ? (
                    <LoadingButton />
                  ) : (
                    <LockClosedIcon
                      className="h-5 w-5 text-indigo-500 group-hover:text-indigo-400"
                      aria-hidden="true"
                    />
                  )}
                </span>
                Sign in
              </button>
            </div>
          </form>
        </div>
      </div>
      <NotificationElement
        success={wasSuccess}
        titleToDisplay={titleToDisplay}
        textToDisplay={textToDisplay}
        doShow={doShow}
        setShow={() => {
          setDoShow(false);
        }}
      />
    </>
  );
}
