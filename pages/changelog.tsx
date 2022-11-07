import Head from 'next/head'
import PageTitle from '../components/UI/PageTitle'
import styled from 'styled-components'
import Linker from '../components/UI/Linker'

const Section = styled.div`
  padding-top: 16px;

  &:first-child {
    padding-top: 0;
  }
`

const SubSectionTitle = styled.div`
  font-weight: 700;
  padding-bottom: 8px;
`

const StyledUl = styled.ul`
  margin-left: 8px;
`

const StyledLi = styled.li`
  list-style: square;
  margin-left: 16px;
`

const AddedInfo = styled.div`
  border-left: 2px solid ${(props) => props.theme.text};
  font-size: 14px;
  margin-top: 2px;
  margin-bottom: 8px;
  margin-left: 16px;
  padding-left: 8px;
`

/** TEMPLATE

<Section>
  <SubSectionTitle>2022.10.27</SubSectionTitle>
  <StyledUl>
    <StyledLi>test</StyledLi>
  </StyledUl>
</Section>

<AddedInfo> exists for further explanation
*/

const Changelog = () => {
  return (
    <div className="mb-4">
      <Head>
        <title>ArtBot - Changelog</title>
      </Head>
      <PageTitle>Changelog</PageTitle>
      <Section>
        <SubSectionTitle>2022.11.07</SubSectionTitle>
        <StyledUl>
          <StyledLi>
            Fix denoising strength not showing up on advanced options panel when
            creating a new img2img request. (Note: due to limitations with the
            Stable Horde API, denoise is only available for img2img and not
            inpainting)
          </StyledLi>
          <StyledLi>
            Updated max steps to 500 for logged in users, providing you have
            enough kudos (add your Stable Horde API key to the settings page to
            log in).
          </StyledLi>
          <StyledLi>Fix: You can now choose random models again.</StyledLi>
          <StyledLi>
            Model descriptions now added below dropdown on advanced options
            panel. If a custom model requires the use of a trigger to activate,
            it is now automatically added to the beginning of your prompt when
            sent to the API.
          </StyledLi>
        </StyledUl>
      </Section>
      <Section>
        <SubSectionTitle>2022.11.06</SubSectionTitle>
        <StyledUl>
          <StyledLi>
            Feature: Mark images as favorites, and filter images on the main
            gallery page (by favorited / non-favorited, image generation type
            and more to come soon).
          </StyledLi>
        </StyledUl>
      </Section>
      <Section>
        <SubSectionTitle>2022.11.05</SubSectionTitle>
        <StyledUl>
          <StyledLi>
            Feature: Bulk delete images from the{' '}
            <Linker href="/images">images page</Linker>. Just hit the select /
            checkmark button in the top right to start choosing. I will bring
            this to the image details page in the near future.
          </StyledLi>
        </StyledUl>
      </Section>
      <Section>
        <SubSectionTitle>2022.11.04</SubSectionTitle>
        <StyledUl>
          <StyledLi>
            MILESTONE: 200,000 images have been created with ArtBot!
          </StyledLi>
          <StyledLi>
            Add dropdown menu button to{' '}
            <Linker href="/images">images page</Linker> to change sort order of
            images and layout
          </StyledLi>
          <StyledLi>
            Better limits and validation for advanced parameters on the create
            image page, this is especially helpful for logged out or anonymous
            users.
          </StyledLi>
          <StyledLi>
            Make ID of the worker that generated an image visible on image
            details page. This is useful in case you need to report an unsavory
            worker that is running within the cluster. You can report these
            sorts of images on the{' '}
            <Linker
              href="https://discord.com/channels/781145214752129095/1027506429139095562"
              target="_blank"
            >
              Stable Horde Discord channel
            </Linker>
            .
          </StyledLi>
        </StyledUl>
      </Section>
      <Section>
        <SubSectionTitle>2022.11.03</SubSectionTitle>
        <StyledUl>
          <StyledLi>
            FEATURE: Big changes!{' '}
            <Linker href="/?panel=inpainting">Inpainting is now live.</Linker>{' '}
            Upload a photo from a URL, from your device or even use an existing
            image that you&apos;ve created.
          </StyledLi>
          <StyledLi>
            FEATURE: Custom image orientations (you are no longer limited to the
            few aspect ratios I provided for you). Image dimensions must be
            divisible by 64, but I handle that for you after you&apos;ve entered
            your desired dimensions.
          </StyledLi>
          <StyledLi>
            In my endless tinkering, the advanced options panel on the create
            page is now open by default.
          </StyledLi>
          <StyledLi>
            Added some validation to various input fields inside advanced
            options, as well as subtext defining the requiered parameters.
          </StyledLi>
          <StyledLi>
            Temporarily removed painter page while I refactor a few things to
            make it more mobile friendly (and to tie into the existing img2img
            and inpainting system)
          </StyledLi>
          <StyledLi>
            Add ability to sort <Linker href="/images">images page</Linker> by
            newest or oldest images, as well as the ability to jump to the
            beginning or end of your image collection.
          </StyledLi>
        </StyledUl>
      </Section>
      <Section>
        <SubSectionTitle>2022.10.30</SubSectionTitle>
        <StyledUl>
          <StyledLi>
            Add some debugging logic to attempt to capture some pesky
            &quot;server did not respond to the image request&quot; errors that
            some people are encountering. Pretty sure it&apos;s something on my
            end and not with the Stable Horde cluster.
          </StyledLi>
          <StyledLi>
            Small design change to paint page to make toolbar and overall theme
            more consistent across dark / light mode.
          </StyledLi>
          <StyledLi>
            Fix: Hide inpainting model from models dropdown in non inpainting
            contexts. (e.g., selecting a model from the dropdown menu when doing
            a simple text2img prompt)
          </StyledLi>
          <StyledLi>
            Small feature: Support for uploading images into the{' '}
            <Linker href="/paint">painter page</Linker>
          </StyledLi>
        </StyledUl>
      </Section>
      <Section>
        <SubSectionTitle>2022.10.28</SubSectionTitle>
        <StyledUl>
          <StyledLi>
            NEW FEATURE: 🎨 <Linker href="/paint">Painting!</Linker> You can now
            paint your own images and then send them to the img2img feature.
            <AddedInfo>
              Turn your cheesy drawings into awesome AI generated art. This is
              somewhat in beta as I&apos;m working out some kinks with the
              painting library{' '}
              <Linker href="http://fabricjs.com/" target="_blank">
                (Fabric.js)
              </Linker>
              . This should also lay the groundwork for inpainting support once
              the Stable Horde cluster supports it.
            </AddedInfo>
          </StyledLi>
          <StyledLi>
            Show source image on details page if an image was generated via
            img2img. Also added an upload icon in the top right corner of this
            source image, so you can quickly create / modify a new prompt using
            the original image.
          </StyledLi>
        </StyledUl>
      </Section>
      <Section>
        <SubSectionTitle>2022.10.27</SubSectionTitle>
        <StyledUl>
          <StyledLi>
            Add light / dark theme options
            <AddedInfo>
              Currently locked to system settings, but I will add an option for
              user preference in the future.
            </AddedInfo>
          </StyledLi>
          <StyledLi>
            Refactored &quot;advanced options panel&quot; on{' '}
            <Linker href="/">main create page</Linker>.
            <AddedInfo>
              The thinking here is to simplify the front page as much as
              possible. If someone has no experience with generative AI art, let
              them quickly create something.
            </AddedInfo>
          </StyledLi>
          <StyledLi>
            Refactored pending item component (background color, text spacing
            issues)
          </StyledLi>
          <StyledLi>
            Fixed: issue when attempting to choose a random sampler.
          </StyledLi>
          <StyledLi>
            Fixed: issue where choosing a model (e.g., stable_diffusion) would
            get saved as a variable for samplers, resulting in payload
            validation errors from the API. This is why testing your code is
            important. Ah hem.
          </StyledLi>
          <StyledLi>
            Track initial estimated wait time returned from API
            <AddedInfo>
              Relates to future feature that will attempt to detect if job has
              gone stale and attempt to retry / resubmit
            </AddedInfo>
          </StyledLi>
          <StyledLi>
            Add new contact form accessible from the{' '}
            <Linker href="/about">about page</Linker>. Questions, comments, or
            bug reports? Send me a message.
          </StyledLi>
        </StyledUl>
      </Section>
      <Section>
        <SubSectionTitle>2022.10.24</SubSectionTitle>
        <StyledUl>
          <StyledLi>
            MILESTONE: 100,000 images have been created with ArtBot!
          </StyledLi>
          <StyledLi>
            You can now import images directly from a URL in order to use the
            img2img feature with stable diffusion.
          </StyledLi>
          <StyledLi>
            In the models dropdown list, you can now see the number of workers
            running each model
            <AddedInfo>
              More workers generally means quicker generation times. This is
              helpful if you want to crank through a number of images.
            </AddedInfo>
          </StyledLi>
        </StyledUl>
      </Section>
      <Section>
        <SubSectionTitle>2022.10.20</SubSectionTitle>
        <StyledUl>
          <StyledLi>img2img support is now live for **ALL** users!</StyledLi>
        </StyledUl>
      </Section>
      <Section>
        <SubSectionTitle>2022.10.18</SubSectionTitle>
        <StyledUl>
          <StyledLi>
            PURE CHAOS MODE: Add random option to orientation, sampler and
            models. Try a random selection on one... or all three if you&apos;re
            crazy.
          </StyledLi>
        </StyledUl>
      </Section>
      <Section>
        <SubSectionTitle>2022.10.17</SubSectionTitle>
        <StyledUl>
          <StyledLi>
            img2img support is live for trusted users (generally those who are
            contributing back to the Stable Horde with GPU cycles).
          </StyledLi>
          <StyledLi>
            Initial work on getting ArtBot setup as a proper Progressive Web App
            (PWA)
            <AddedInfo>
              Add it to your mobile device homescreen for a more app like
              experience
            </AddedInfo>
          </StyledLi>
          <StyledLi>
            Add simple pagination buttons for{' '}
            <Linker href="/images">images page</Linker> (things were getting
            slow if you had a lot of images stored in the browser cache).
          </StyledLi>
        </StyledUl>
      </Section>
      <Section>
        <SubSectionTitle>2022.10.14</SubSectionTitle>
        <StyledUl>
          <StyledLi>
            MILESTONE: 10,000 images have been created using ArtBot!
          </StyledLi>
          <StyledLi>
            Add option to download PNG of your image
            <AddedInfo>
              Due to bandwidth constraints, the Stable Horde sends images as a
              WEBP file. This isn&apos;t always optimal for downloading to your
              local device. On each image details page, you will see a download
              button (down arrow).
            </AddedInfo>
          </StyledLi>
        </StyledUl>
      </Section>
      <Section>
        <SubSectionTitle>2022.10.11</SubSectionTitle>
        <StyledUl>
          <StyledLi>
            MILESTONE: 1,000 images have been created using ArtBot!
          </StyledLi>
        </StyledUl>
      </Section>
      <Section>
        <SubSectionTitle>2022.10.09</SubSectionTitle>
        <StyledUl>
          <StyledLi>ARTBOT IS OFFICIALLY LAUNCHED! 🎉🎉🎉</StyledLi>
          <StyledLi>
            Quick fix: You can now generate more than 1 image at a time.
          </StyledLi>
        </StyledUl>
      </Section>
    </div>
  )
}

export default Changelog
