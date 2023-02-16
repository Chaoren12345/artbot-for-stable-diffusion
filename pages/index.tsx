/* eslint-disable @next/next/no-img-element */
import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import type { NextPage } from 'next'
import { useRouter } from 'next/router'

import { createImageJob } from '../utils/imageCache'
import PageTitle from '../components/UI/PageTitle'
import {
  loadEditPrompt,
  savePromptHistory,
  SourceProcessing
} from '../utils/promptUtils'
import TextArea from '../components/UI/TextArea'
import { Button } from '../components/UI/Button'
import TrashIcon from '../components/icons/TrashIcon'
import SquarePlusIcon from '../components/icons/SquarePlusIcon'
import { trackEvent, trackGaEvent } from '../api/telemetry'
import OptionsPanel from '../components/CreatePage/OptionsPanel'
import { clearCanvasStore, getCanvasStore } from '../store/canvasStore'
import {
  clearInputCache,
  getInputCache,
  setInputCache
} from '../store/inputCache'
import { useEffectOnce } from '../hooks/useEffectOnce'
import { getDefaultPrompt } from '../utils/db'
import CreateImageRequest from '../models/CreateImageRequest'
import ShareLinkDetails from '../models/ShareableLink'
import Head from 'next/head'
import { setModelDetails } from '../store/modelStore'
import ServerMessage from '../components/ServerMessage'
import StylesDropdown from '../components/CreatePage/StylesDropdown'
import { useStore } from 'statery'
import { appInfoStore } from '../store/appStore'
import AppSettings from '../models/AppSettings'
import {
  countImagesToGenerate,
  kudosCost,
  orientationDetails
} from '../utils/imageUtils'
import { toast } from 'react-toastify'
import Linker from '../components/UI/Linker'
import InteractiveModal from '../components/UI/InteractiveModal/interactiveModal'
import PromptHistory from '../components/PromptHistory'
import MenuButton from '../components/UI/MenuButton'
import HistoryIcon from '../components/icons/HistoryIcon'
import PlusIcon from '../components/icons/PlusIcon'
import Tooltip from '../components/UI/Tooltip'
import useComponentState from '../hooks/useComponentState'
import DropDownMenu from '../components/UI/DropDownMenu/dropDownMenu'
import DropDownMenuItem from '../components/UI/DropDownMenuItem'
import MinusIcon from '../components/icons/MinusIcon'
import styled from 'styled-components'
import PromptInputSettings from '../models/PromptInputSettings'
import { validModelsArray } from '../utils/modelUtils'
import { userInfoStore } from '../store/userStore'

interface InputTarget {
  name: string
  value: string
}
interface InputEvent {
  target: InputTarget
}

const ModelTriggerButton = styled.div`
  align-items: center;
  color: ${(props) => props.theme.navLinkActive};
  cursor: pointer;
  display: flex;
  flex-direction: row;
  margin-bottom: 4px;
  position: relative;
`

interface IStickyArea {
  disableFixed?: boolean
  fixed?: boolean
}

const StickyTextArea = styled.div<IStickyArea>`
  padding-bottom: 4px;
  position: relative;
  z-index: 20;
  width: 100%;

  /* @media (min-width: 640px) {
    ${(props) =>
    !props.disableFixed &&
    `
      top: calc(52px + env(safe-area-inset-top));
      position: sticky;
      position: -webkit-sticky;
      position: -moz-sticky;
      position: -o-sticky;
      position: -ms-sticky;
      `}
  } */
`

const defaultState: any = {
  img2img: false,
  upscaled: false,
  imageType: '',
  orientationType: 'square',
  height: 512,
  width: 512,
  numImages: 1,
  prompt: '',
  sampler: 'k_euler_a',
  cfg_scale: 9,
  steps: 20,
  multiSteps: '',
  multiGuidance: '',
  seed: '',
  denoising_strength: 0.75,
  karras: true,
  hires: false,
  clipskip: 1,
  parentJobId: '',
  negative: '',
  triggers: [],
  tiling: false,
  source_image: '',
  source_mask: '',
  stylePreset: 'none',
  source_processing: SourceProcessing.Prompt,
  post_processing: [],
  models: ['stable_diffusion'],
  useAllModels: false,
  useFavoriteModels: false,
  useAllSamplers: false,
  useMultiSteps: false,
  useMultiGuidance: false,
  canvasData: null,
  maskData: null
}

export async function getServerSideProps() {
  let availableModels: Array<any> = []
  let modelDetails: any = {}

  try {
    const availableModelsRes = await fetch(
      `http://localhost:${process.env.PORT}/artbot/api/v1/models/available`
    )
    const availableModelsData = (await availableModelsRes.json()) || {}
    availableModels = availableModelsData.models

    const modelDetailsRes = await fetch(
      `http://localhost:${process.env.PORT}/artbot/api/v1/models/details`
    )
    const modelDetailsData = (await modelDetailsRes.json()) || {}
    modelDetails = modelDetailsData.models
  } catch (err) {}

  return {
    props: {
      availableModels,
      modelDetails
    }
  }
}

const Home: NextPage = ({ availableModels, modelDetails }: any) => {
  const appState = useStore(appInfoStore)
  const userInfo = useStore(userInfoStore)

  const { buildId } = appState
  const { loggedIn } = userInfo

  const ref = useRef(null)
  const [build, setBuild] = useState(buildId)

  const router = useRouter()
  const { query } = router

  const editMode = query.edit
  const loadModel = query.model
  const shareMode = query.share

  let initialState: any = defaultState

  if (loadModel === 'stable_diffusion_2.0') {
    initialState.models = [loadModel]
    initialState.sampler = 'dpmsolver'
  } else if (loadModel) {
    initialState.models = [loadModel]
  }

  if (shareMode) {
    const shareParams = ShareLinkDetails.decode(shareMode as string) || {}
    initialState = { ...defaultState, ...shareParams }
  } else if (editMode) {
    initialState = {
      ...loadEditPrompt(),
      upscaled: false,
      numImages: 1,
      post_processing: [],
      useAllModels: false,
      useFavoriteModels: false,
      useAllSamplers: false
    }
  }

  const [componentState, setComponentState] = useComponentState({
    showTriggerWordsModal: false
  })

  const [showPromptHistory, setShowPromptHistory] = useState(false)
  const [hasValidationError, setHasValidationError] = useState(false)
  const [pending, setPending] = useState(false)
  const [hasError, setHasError] = useState('')
  const [input, setInput] = useReducer((state: any, newState: any) => {
    setInputCache({ ...state, ...newState })
    return { ...state, ...newState }
  }, initialState)

  const watchBuild = useCallback(() => {
    if (!build) {
      setBuild(buildId)
      return
    }

    if (buildId !== build) {
      const imageParams = new CreateImageRequest(input)
      // @ts-ignore
      const shareLinkDetails = ShareLinkDetails.encode(imageParams)
      localStorage.setItem('reloadPrompt', shareLinkDetails)
    }
  }, [build, buildId, input])

  const handleChangeValue = (event: InputEvent) => {
    const inputName = event.target.name
    const inputValue = event.target.value

    if (inputName !== 'prompt' && inputName !== 'seed') {
      PromptInputSettings.set(inputName, inputValue)
    } else if (
      AppSettings.get('savePromptOnCreate') &&
      inputName === 'prompt'
    ) {
      PromptInputSettings.set('prompt', inputValue)
    } else if (AppSettings.get('saveSeedOnCreate') && inputName === 'seed') {
      PromptInputSettings.set('seed', inputValue)
    }

    setInput({ [inputName]: inputValue })
  }

  const handleImageUpload = (imageType: string, source_image: string) => {
    setInput({
      img2img: true,
      imageType,
      source_image
    })
  }

  const handleOrientationSelect = (orientation: string, options?: any) => {
    const details = orientationDetails(orientation, input.height, input.width)

    setInput({
      orientationType: orientation,
      height: details.height,
      width: details.width
    })

    if (!options?.initLoad) {
      trackEvent({
        event: 'ORIENTATION_CLICK',
        context: '/pages/index',
        data: {
          orientation
        }
      })
    }
  }

  const handleSubmit = async () => {
    // TODO: Rather than directly send to API, we should queue up
    // jobs so we only ever send one job at a time to the API?

    if (hasValidationError || pending) {
      return
    }

    setPending(true)

    if (!input?.prompt || input?.prompt.trim() === '') {
      setHasError('Please enter a prompt to continue.')
      setPending(false)
      return
    }

    const imageJobData = {
      ...input
    }

    if (getCanvasStore().cached && getCanvasStore().canvasRef) {
      imageJobData.canvasStore = { ...getCanvasStore() }
    }

    // Handle weird error that's been cropping up where canvas is empty but inpainting is true:
    if (
      !getCanvasStore().canvasRef &&
      input.source_processing === SourceProcessing.InPainting
    ) {
      setInput({
        source_processing: SourceProcessing.Prompt
      })
    }

    trackEvent({
      event: 'NEW_IMAGE_REQUEST',
      context: '/pages/index',
      data: {
        orientation: input.orientationType,
        sampler: input.sampler,
        steps: input.steps,
        numImages: input.numImages,
        model: input.models,
        source: input.source_processing,
        prompt: input.prompt,
        post_processing: input.post_processing
      }
    })
    trackGaEvent({
      action: 'new_img_request',
      params: {
        type: input.img2img ? 'img2img' : 'prompt2img'
      }
    })

    const inputToSubmit = { ...input }

    if (input.useFavoriteModels) {
      const favModels = AppSettings.get('favoriteModels') || {}

      const modelsArray =
        Object.keys(favModels).length > 0
          ? (inputToSubmit.models = [...Object.keys(favModels)])
          : 'stable_diffusion'
      input.models = [...modelsArray]
    }

    savePromptHistory(input.prompt)
    await createImageJob(new CreateImageRequest(inputToSubmit))

    // Store parameters for potentially restoring inpainting data if needed
    let inpaintCache = {
      orientationType: input.orientationType,
      height: input.height,
      width: input.width,
      source_processing: input.source_processing,
      source_image: input.source_image,
      source_mask: input.source_mask
    }

    if (!AppSettings.get('stayOnCreate')) {
      if (!AppSettings.get('saveInputOnCreate')) {
        clearInputCache()
      }

      if (!AppSettings.get('saveCanvasOnCreate')) {
        clearCanvasStore()
      } else {
        setInputCache({ ...inpaintCache })
      }

      router.push('/pending')
    } else {
      if (AppSettings.get('saveCanvasOnCreate')) {
        setInput({ ...inpaintCache })
      }

      toast.success('Image requested!', {
        pauseOnFocusLoss: false,
        position: 'top-center',
        autoClose: 2500,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: false,
        progress: undefined,
        theme: 'light'
      })
      setPending(false)
    }
  }

  const onEnterPress = (e: KeyboardEvent) => {
    if (e.keyCode == 13 && e.shiftKey == false) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const resetInput = async () => {
    const defaultPromptResult = (await getDefaultPrompt()) || []
    const [defaultPrompt = {}] = defaultPromptResult

    const newDefaultState = Object.assign({}, defaultState, {
      negative: defaultPrompt.prompt || ''
    })

    clearCanvasStore()
    setInput(newDefaultState)
  }

  const updateDefaultInput = async () => {
    if (!editMode && !shareMode) {
      const updateObject = PromptInputSettings.load()
      delete updateObject.v

      if (!AppSettings.get('savePromptOnCreate')) {
        delete updateObject.prompt
      }

      if (!AppSettings.get('saveSeedOnCreate')) {
        delete updateObject.seed
      }

      setInput({ ...updateObject })

      if (PromptInputSettings.load().showMultiModel) {
        setComponentState({
          showMultiModel: true
        })
      }
    }
  }

  useEffect(() => {
    watchBuild()
  }, [watchBuild])

  useEffect(() => {
    if (!editMode && !shareMode) {
      updateDefaultInput()
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const hasModel = availableModels.filter((model: any) => {
      return model.name === input.models[0]
    })

    if (hasModel.length === 0 && !shareMode) {
      setComponentState({
        models: ['stable_diffusion'],
        sampler: 'k_euler_a'
      })
    }
  }, [availableModels, input.models, setComponentState, shareMode])

  useEffectOnce(() => {
    trackEvent({
      event: 'PAGE_VIEW',
      context: '/pages/index'
    })

    setModelDetails(modelDetails)

    const restorePrompt = localStorage.getItem('reloadPrompt')

    if (restorePrompt) {
      const shareParams = ShareLinkDetails.decode(restorePrompt as string) || {}
      initialState = { ...defaultState, ...shareParams }
      setInput({ ...initialState })
      localStorage.removeItem('reloadPrompt')
    } else if (!editMode && !shareMode && !loadModel && getInputCache()) {
      setInput({ ...getInputCache() })
    } else if (editMode) {
      setInput({ ...loadEditPrompt() })
    }
  })

  const triggerArray = [...(modelDetails[input?.models[0]]?.trigger ?? '')]
  const totalImagesRequested = countImagesToGenerate(input)
  const totalKudosCost = kudosCost(
    input.width,
    input.height,
    input.steps,
    totalImagesRequested || 1,
    input.post_processing.indexOf('RealESRGAN_x4plus') === -1 ? false : true,
    input.post_processing.length,
    input.sampler
  )

  const kudosPerImage =
    totalImagesRequested < 1 ||
    isNaN(totalKudosCost) ||
    isNaN(totalImagesRequested)
      ? 'N/A'
      : Number(totalKudosCost / totalImagesRequested).toFixed(2)

  const fixedSeedErrorMsg =
    'Warning: You are using a fixed seed with multiple images. (You can still continue)'
  if (
    hasError !== fixedSeedErrorMsg &&
    totalImagesRequested > 1 &&
    input.seed
  ) {
    setHasError(fixedSeedErrorMsg)
  } else if (
    hasError === fixedSeedErrorMsg &&
    totalImagesRequested > 1 &&
    !input.seed
  ) {
    setHasError('')
  }

  useEffect(() => {
    const { source_mask, source_image, tiling, models = [] } = input || {}

    const modelerOptions = (imageParams: any) => {
      const modelsArray = validModelsArray({ imageParams }) || []
      modelsArray.push({
        name: 'random',
        value: 'random',
        label: 'Random!',
        count: 1
      })

      return modelsArray
    }

    const modelExists = modelerOptions(input).filter((option) => {
      return input?.models?.indexOf(option.value) >= 0
    })

    if (
      models[0] === 'stable_diffusion_inpainting' ||
      models[0] === 'Stable Diffusion 2 Depth'
    ) {
      // Handle state where an incorrect model might be cached
      // e.g., "stable_diffusion_inpainting" when first loading page.
      if (!shareMode && (!modelExists || modelExists.length === 0)) {
        setInput({
          models: ['stable_diffusion'],
          sampler: 'k_euler_a'
        })
      }
    }

    if (isNaN(input.numImages)) {
      setInput({ numImages: 1 })
    }

    // Handle state where tiling is incorrectly set in case of img2img or inpainting
    if (
      (source_mask ||
        source_image ||
        models[0] === 'Stable Diffusion 2 Depth') &&
      tiling === true
    ) {
      setInput({
        tiling: false
      })
    }
  }, [input, shareMode])

  return (
    <main>
      {showPromptHistory && (
        <InteractiveModal handleClose={() => setShowPromptHistory(false)}>
          <PromptHistory
            copyPrompt={setInput}
            handleClose={() => setShowPromptHistory(false)}
          />
        </InteractiveModal>
      )}
      {shareMode ? (
        <Head>
          <title>ArtBot - Shareable Link</title>
          <meta name="twitter:title" content="ArtBot - Shareable Link" />
          <meta
            name="twitter:description"
            content={`Prompt: "${input.prompt}"`}
          />
          <meta name="twitter:image" content="" />
        </Head>
      ) : null}
      <div className="flex flex-row w-full items-center">
        <div className="inline-block w-1/2">
          <PageTitle>
            New image{' '}
            {input.source_processing === 'outpainting' && '(outpainting)'}
            {input.source_processing === 'inpainting' && '(inpainting)'}
            {input.source_processing === 'img2img' && '(img2img)'}
          </PageTitle>
        </div>
        <div className="flex flex-row justify-end w-1/2 items-start h-[38px] relative gap-2">
          <MenuButton
            active={showPromptHistory}
            title=""
            onClick={() => {
              setShowPromptHistory(true)
            }}
          >
            <HistoryIcon size={24} />
          </MenuButton>
        </div>
      </div>
      <ServerMessage />
      {input.source_processing !== 'inpainting' &&
        modelDetails[input?.models[0]]?.trigger && (
          <>
            <ModelTriggerButton
              onClick={() => {
                if (!componentState.showTriggerWordsModal) {
                  setComponentState({ showTriggerWordsModal: true })
                } else {
                  setComponentState({ showTriggerWordsModal: false })
                }
              }}
            >
              <div className="mr-2">
                {componentState.showTriggerWordsModal ? (
                  <MinusIcon />
                ) : (
                  <PlusIcon />
                )}
              </div>
              [ Model trigger ]
              <Tooltip width="240px">
                This model requires the use of certain trigger words in order to
                fully utilize its abilities. Click here to add trigger words
                into your prompt.
              </Tooltip>
            </ModelTriggerButton>
            {componentState.showTriggerWordsModal && (
              <div className="relative top-[-38px] z-[21]">
                <DropDownMenu
                  handleClose={() => {
                    setComponentState({ showTriggerWordsModal: false })
                  }}
                  position="left"
                >
                  {triggerArray && triggerArray.length > 0
                    ? triggerArray.map((trigger: string, i: number) => {
                        return (
                          <DropDownMenuItem
                            key={`${trigger}_${i}`}
                            onClick={() => {
                              const value = `${trigger} ` + input.prompt + ` `
                              if (AppSettings.get('savePromptOnCreate')) {
                                PromptInputSettings.set('prompt', value)
                              }

                              setInput({
                                prompt: value
                              })
                              setComponentState({
                                showTriggerWordsModal: false
                              })
                              if (ref && ref.current) {
                                // @ts-ignore
                                ref.current.focus()
                              }
                            }}
                          >
                            {trigger}
                          </DropDownMenuItem>
                        )
                      })
                    : null}
                </DropDownMenu>
              </div>
            )}
          </>
        )}
      <StickyTextArea disableFixed={query && query.panel ? true : false}>
        <TextArea
          name="prompt"
          className="block bg-white p-2.5 w-full text-lg text-black rounded-lg max-h-[250px] border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Image prompt..."
          onChange={handleChangeValue}
          // @ts-ignore
          onKeyDown={onEnterPress}
          value={input.prompt}
          ref={ref}
        />
        {hasValidationError && (
          <div className="mt-2 text-red-500 font-semibold">
            Please correct all input errors before continuing
          </div>
        )}
        {hasError && hasError === fixedSeedErrorMsg && (
          <div className="mt-2 text-amber-400 font-semibold">
            {fixedSeedErrorMsg}
          </div>
        )}
        {hasError && hasError !== fixedSeedErrorMsg && (
          <div className="mt-2 text-red-500 font-semibold">
            Error: {hasError}
          </div>
        )}
        <div className="mt-2 mb-4 w-full flex flex-row gap-2 justify-end items-start">
          <div className="w-1/2 text-sm flex flex-row justify-start gap-2 items-center">
            Style:{' '}
            <StylesDropdown
              input={input}
              setInput={setInput}
              isSearchable={true}
            />
          </div>
          <div className="w-1/2 flex flex-col justify-start gap-2">
            <div className="flex flex-row justify-end gap-2 sm:mt-0">
              <Button
                title="Clear current input"
                btnType="secondary"
                onClick={resetInput}
              >
                <span>
                  <TrashIcon />
                </span>
                <span className="hidden md:inline-block">Clear</span>
              </Button>
              <Button
                title="Create new image"
                onClick={handleSubmit}
                disabled={hasValidationError || pending}
                width="100px"
              >
                <span>{pending ? '' : <SquarePlusIcon />}</span>
                {pending ? 'Creating...' : 'Create'}
              </Button>
            </div>
            <div className="flex flex-row justify-end">
              <div className="flex flex-col justify-end">
                <div className="text-xs flex flex-row justify-end gap-2">
                  Images to request:{' '}
                  <strong>{' ' + totalImagesRequested}</strong>
                </div>
                {loggedIn && (
                  <>
                    <div className="text-xs flex flex-row justify-end gap-2">
                      {' '}
                      Generation cost:{' '}
                      <Linker href="/faq#kudos" passHref>
                        <>{totalKudosCost} kudos</>
                      </Linker>
                    </div>
                    <div className="text-xs flex flex-row justify-end gap-2">
                      Per image:{' '}
                      <Linker href="/faq#kudos" passHref>
                        <>{kudosPerImage} kudos</>
                      </Linker>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </StickyTextArea>
      <OptionsPanel
        handleChangeInput={handleChangeValue}
        handleImageUpload={handleImageUpload}
        handleOrientationSelect={handleOrientationSelect}
        input={input}
        setInput={setInput}
        setHasValidationError={setHasValidationError}
      />
      <div className="w-full mt-2 flex flex-col justify-end gap-2">
        <div className="flex flex-row justify-end gap-2 sm:mt-0">
          <Button
            title="Clear current input"
            btnType="secondary"
            onClick={resetInput}
          >
            <span>
              <TrashIcon />
            </span>
            <span className="hidden md:inline-block">Clear</span>
          </Button>
          <Button
            title="Create new image"
            onClick={handleSubmit}
            disabled={hasValidationError || pending}
            width="100px"
          >
            <span>{pending ? '' : <SquarePlusIcon />}</span>
            {pending ? 'Creating...' : 'Create'}
          </Button>
        </div>
        <div className="flex flex-row justify-end">
          <div className="flex flex-col justify-end">
            <div className="text-xs flex flex-row justify-end gap-2">
              Images to request: <strong>{' ' + totalImagesRequested}</strong>
            </div>
            {loggedIn && (
              <>
                <div className="text-xs flex flex-row justify-end gap-2">
                  {' '}
                  Generation cost:{' '}
                  <Linker href="/faq#kudos" passHref>
                    <>{totalKudosCost} kudos</>
                  </Linker>
                </div>
                <div className="text-xs flex flex-row justify-end gap-2">
                  Per image:{' '}
                  <Linker href="/faq#kudos" passHref>
                    <>{kudosPerImage} kudos</>
                  </Linker>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}

export default Home
