import BlockchainLogo from '../BlockchainLogo';
import Modal from '../Modal'
import React from 'react'
import styled from 'styled-components'

interface CrossChainModalProps {
  isOpen: boolean;
  onDismiss: () => void;
  supportedChains: string[];
  activeChain?: string;
  isTransfer?: boolean;
  selectTransferChain: (str: string) => void;
}

const ModalContainer = styled.div`
  padding: 1.5rem;
  h5 {
    font-weight: bold;
    margin-bottom: 1rem;
  }
  p {
    font-size: .85rem;
    margin-top: 1rem;
    line-height: 20px;
    color: #CED0D9;
    a {
      font-weight: bold;
      color: ${({ theme }) => theme.primary1};
      cursor: pointer;
      outline: none;
      text-decoration: none;
      margin-left: 4px; margin-right: 4px;
    }
  }
  ul {
    display: flex;
    flex-direction: row;
    width: 100%;
    li {
      display: flex;
      flex-direction: column;
      margin: 1rem;
      position: relative;
      padding: 12px;
      transition: all .2s ease-in-out;
      border-radius: 12px;
      &.active {
        background: rgba(255,255,255,.1);
        &:before {
          position: absolute;
          content: '';
          width: 8px;
          height: 8px;
          border-radius: 100%;
          background: ${({ theme }) => theme.primary1};
          top: 8px; right: 8px;
        }
      }
      &.disabled {
        opacity: .35;
        pointer-events: none;
        user-select: none;
      }
      &.selectable {
        cursor: pointer;
        &:hover {
          border-radius: 12px;
          background: rgba(255,255,255,.1);
        }
      }
      img {
        margin: auto;
        margin-bottom: .5rem;
      }
      &:first-of-type {
        margin-left: 0;
      }
      span {

      }
    }
  }
`
export default function CrossChainModal({
  isOpen,
  onDismiss,
  supportedChains,
  activeChain,
  isTransfer,
  selectTransferChain,
}: CrossChainModalProps) {
  return (
    <Modal isOpen={isOpen} onDismiss={onDismiss}>
      <ModalContainer>
        { !isTransfer && <h5>Supported Blockchains:</h5>}
        { isTransfer && <h5>Transfer tokens to:</h5>}
        <ul>
          {supportedChains.map(chain =>
            <li onClick={() => {
                if (isTransfer) {
                  selectTransferChain(chain)
                  onDismiss()
                }
              }}
              className={`
              ${activeChain === chain && !isTransfer ? 'active' : ''}
              ${(activeChain === chain && isTransfer) || chain === 'Polkadot' ? 'disabled' : ''}
              ${isTransfer && activeChain !== chain ? 'selectable' : ''}
            `}>
              <BlockchainLogo size="28px" blockchain={chain} />
              <span>{chain}</span>
            </li>
          )}
        </ul>
        <p>
          To see your token assets on the correct chain, you must
          <a href="https://metamask.zendesk.com/hc/en-us/articles/360043227612-How-to-add-a-custom-Network-RPC-and-or-Block-Explorer"
            rel="noopener noreferrer"
            target="_blank">
            configure the Network RPC
          </a>
          of your connected wallet.
        </p>
      </ModalContainer>
    </Modal>
  )
}
